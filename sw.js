const CACHE = 'tradelog-v1';

// On install — skip waiting so new SW activates immediately
self.addEventListener('install', e => {
  self.skipWaiting();
});

// On activate — clean up any old caches and take control right away
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first fetch strategy:
// Always try the network first. If it succeeds, update the cache and return the fresh response.
// If the network fails (offline), fall back to the cached version.
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(networkRes => {
        // Got a fresh response — clone it into cache and return it
        const resClone = networkRes.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, resClone));
        return networkRes;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(e.request).then(cached => cached || caches.match('./index.html'));
      })
  );
});
