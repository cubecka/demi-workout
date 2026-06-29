const CACHE_NAME = "demi-workout-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting(); // force new SW immediately
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// NETWORK-FIRST (fix for iOS stale cache issues)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
