// ============================================================
// SW.JS — Alarmavision SG-SST · Página de inicio (Launcher)
// Versión: 1.0.0
// Este SW es necesario para que el navegador considere la
// página raíz como instalable (criterio PWA).
// ============================================================

const CACHE_NAME = 'sgsst-root-v1';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './shared/icons/icon-192.png',
  './shared/icons/icon-512.png',
];

// INSTALL
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE).catch((e) =>
        console.warn('[SW Root] Pre-cache parcial:', e)
      )
    )
  );
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('sgsst-root-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH — Cache-first para assets, red para el resto
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Solo cachear recursos propios
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});