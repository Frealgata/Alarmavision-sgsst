// ============================================================
// SERVICE WORKER — Alarmavision SG-SST
// Estrategia: Network-First para HTML/JS/Config, Cache-First para assets estáticos
// VERSIÓN: se actualiza automáticamente con cada build
// ============================================================

const SW_VERSION = 'sgsst-v' + Date.now(); // Cambia cada vez que el SW se registra
const CACHE_STATIC = 'sgsst-static-v3';
const CACHE_FONTS  = 'sgsst-fonts-v1';

// Solo cachear assets estáticos que no cambian (fuentes, iconos)
const STATIC_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap'
];

// ── INSTALL: pre-cache mínimo ──────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting(); // Activar inmediatamente sin esperar
  event.waitUntil(
    caches.open(CACHE_FONTS).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {}); // No fallar si no hay red
    })
  );
});

// ── ACTIVATE: limpiar caches viejas ───────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_STATIC && key !== CACHE_FONTS)
          .map(key => {
            console.log('[SW] Borrando caché vieja:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim()) // Tomar control inmediato de todas las pestañas
  );
});

// ── FETCH: estrategia por tipo de recurso ─────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ── 1. Peticiones a Google Apps Script → SIEMPRE red, nunca caché ──
  if (url.hostname.includes('script.google.com') || 
      url.hostname.includes('googleapis.com') && url.pathname.includes('/macros')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ── 2. Google Fonts → Cache-First (no cambian) ──
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_FONTS).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // ── 3. HTML principal y JS de la app → Network-First ──
  // Siempre intenta traer la versión más nueva del servidor.
  // Solo usa caché si no hay red (modo offline).
  if (event.request.mode === 'navigate' || 
      url.pathname.endsWith('.html') || 
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request.clone(), { cache: 'no-store' })
        .then(response => {
          // Guardar copia fresca en caché para uso offline futuro
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Sin red → usar caché guardada
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            // Página offline de emergencia
            return new Response(
              `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Sin conexión</title>
              <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#080808;color:#E6EDF3;text-align:center;padding:24px}
              h2{color:#2E5FD9;margin-bottom:12px}p{color:#9EA2A2;font-size:15px}</style></head>
              <body><div><h2>📡 Sin conexión</h2><p>Conéctate a internet para usar la app SG-SST.</p></div></body></html>`,
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          });
        })
    );
    return;
  }

  // ── 4. Imágenes y otros assets → Network-First con fallback ──
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' }).catch(() => caches.match(event.request))
  );
});

// ── MENSAJE: forzar actualización desde la app ────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_ALL_CACHES') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
