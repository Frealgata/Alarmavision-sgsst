// ============================================================
// SW.JS — Alarmavision SG-SST · Panel Administrativo
// Versión: 1.0.0
// Estrategia: Network-first para datos (Sheets API),
//             Cache-first para shell estático.
// El panel admin prioriza datos frescos sobre la caché.
// ============================================================

const CACHE_SHELL  = 'sgsst-desktop-shell-v1';
const CACHE_ASSETS = 'sgsst-desktop-assets-v1';

// Shell de la app (HTML + CSS inline → sólo el archivo principal)
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// Librerías externas que sí se cachean (pesadas, cambian poco)
const CACHEABLE_EXTERNALS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// Dominios que SIEMPRE van por red
const NETWORK_ONLY_DOMAINS = [
  'script.google.com',
  'googleapis.com',
];

// ─────────────────────────────────────────────
// INSTALL — pre-cachear el shell
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[SW Desktop] Pre-cache shell parcial:', err);
      });
    })
  );
});

// ─────────────────────────────────────────────
// ACTIVATE — limpiar versiones anteriores
// ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const CURRENT_CACHES = [CACHE_SHELL, CACHE_ASSETS];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k.startsWith('sgsst-desktop-') && !CURRENT_CACHES.includes(k))
          .map((k) => {
            console.log('[SW Desktop] Eliminando cache obsoleto:', k);
            return caches.delete(k);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────
// FETCH — lógica de caché por tipo de recurso
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ① Google Sheets API → siempre red (datos en tiempo real)
  if (NETWORK_ONLY_DOMAINS.some((d) => url.hostname.includes(d))) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Sin conexión. Los datos mostrados pueden estar desactualizados.'
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      })
    );
    return;
  }

  // ② Librerías externas pesadas (xlsx, jspdf, fonts) → cache-first
  if (CACHEABLE_EXTERNALS.some((d) => url.hostname.includes(d))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_ASSETS).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ③ Shell de la propia app → Network-first con fallback a caché
  //    El panel admin SIEMPRE intenta obtener la versión más nueva
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Actualizar caché con respuesta fresca
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_SHELL).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Sin conexión → servir desde caché
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Fallback final: el index
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match('./index.html');
            }
            return new Response('', { status: 503 });
          });
        })
    );
    return;
  }

  // ④ Cualquier otro → red, sin cachear
  event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
});

// ─────────────────────────────────────────────
// MESSAGE — comunicación con el cliente
// ─────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // El cliente puede pedir limpiar caché tras actualizar la config
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => {
      event.source?.postMessage({ type: 'CACHE_CLEARED' });
    });
  }
});

// ─────────────────────────────────────────────
// PUSH — notificaciones para alertas de riesgo alto
// ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch(e) { data.body = event.data.text(); }

  event.waitUntil(
    self.registration.showNotification(
      data.title || '⚠️ Nuevo reporte de riesgo',
      {
        body:    data.body || 'Hay un nuevo reporte pendiente de atención.',
        icon:    '../shared/icons/icon-192.png',
        badge:   '../shared/icons/icon-96.png',
        tag:     'sgsst-admin-notif',
        renotify: true,
        actions: [
          { action: 'open',  title: 'Ver reporte' },
          { action: 'close', title: 'Ignorar' },
        ],
        data: { url: './index.html#reports' }
      }
    )
  );
});

// Clic en notificación → abrir la app en la sección de reportes
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('desktop-app') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
