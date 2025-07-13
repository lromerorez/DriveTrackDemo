self.addEventListener('install', (event) => {
  event.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
