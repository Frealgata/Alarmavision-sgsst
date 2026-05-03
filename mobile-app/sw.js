// ============================================================
// SW.JS — Alarmavision SG-SST · App Móvil (Emisora)
// Versión: 1.0.0
// Estrategia: Cache-first para assets estáticos,
//             Network-first para llamadas al API de Sheets
// ============================================================

const CACHE_NAME   = 'sgsst-mobile-v1';
const CACHE_STATIC = 'sgsst-mobile-static-v1';

// Assets que se pre-cachean al instalar
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap',
];

// Rutas que NUNCA deben cachearse (siempre red)
const NETWORK_ONLY = [
  'script.google.com',
  'googleapis.com',
];

// ─────────────────────────────────────────────
// INSTALL — pre-cachear assets estáticos
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        // No fallar si algún asset externo no está disponible
        console.warn('[SW Mobile] Pre-cache parcial:', err);
      });
    })
  );
});

// ─────────────────────────────────────────────
// ACTIVATE — limpiar caches viejos
// ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k.startsWith('sgsst-mobile-') && k !== CACHE_STATIC)
          .map((k) => {
            console.log('[SW Mobile] Eliminando cache obsoleto:', k);
            return caches.delete(k);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────
// FETCH — estrategia según el tipo de recurso
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ① Llamadas al Google Apps Script → siempre red (nunca cachear)
  if (NETWORK_ONLY.some((domain) => url.hostname.includes(domain))) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ success: false, error: 'Sin conexión — el reporte se guardó localmente.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // ② Assets de la propia app → Cache-first, luego red
  if (
    url.origin === self.location.origin ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Cachear sólo respuestas válidas
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }).catch(() => {
        // Fallback: si es una página HTML, devolver el index cacheado
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      })
    );
    return;
  }

  // ③ Cualquier otro request → red, sin cachear
  event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
});

// ─────────────────────────────────────────────
// BACKGROUND SYNC — reintentar envíos pendientes
// (requiere registro desde el cliente con 'sync')
// ─────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-reports') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_NEEDED' });
        });
      })
    );
  }
});

// ─────────────────────────────────────────────
// PUSH — notificaciones (placeholder para uso futuro)
// ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Alarmavision SG-SST', {
      body: data.body || 'Tienes un nuevo mensaje.',
      icon: '../shared/icons/icon-192.png',
      badge: '../shared/icons/icon-96.png',
      tag: 'sgsst-notif',
      renotify: true,
    })
  );
});
