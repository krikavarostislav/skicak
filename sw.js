// Skicák Service Worker
// Změň CACHE_NAME při každém nasazení — vynutí reload cache
const CACHE_NAME = 'skicak-v1';

const PRECACHE = [
  './skicak.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first pro lokální assety, network-first pro fonty
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Google Fonts — network first, fallback to cache
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Vše ostatní — cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(r => {
      // Cache pouze same-origin GET requesty
      if (e.request.method === 'GET' && url.origin === self.location.origin) {
        caches.open(CACHE_NAME).then(c => c.put(e.request, r.clone()));
      }
      return r;
    }))
  );
});
