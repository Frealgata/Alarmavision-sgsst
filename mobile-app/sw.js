// Service Worker - Alarmavision SG-SST Mobile
const CACHE_NAME = 'alarmavision-sgsst-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first para assets, network-first para API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Requests a Google Apps Script van directo a red
  if (url.hostname.includes('script.google.com')) {
    e.respondWith(
      fetch(e.request).catch(() => 
        new Response(JSON.stringify({ success: false, offline: true }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Background sync para envíos offline
self.addEventListener('sync', e => {
  if (e.tag === 'sync-reports') {
    e.waitUntil(syncPendingReports());
  }
});

async function syncPendingReports() {
  // Esta función se llama cuando el dispositivo recupera conexión
  // Los reportes pendientes se guardan en IndexedDB por la app principal
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_NEEDED' });
  });
}
