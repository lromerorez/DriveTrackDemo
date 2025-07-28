self.addEventListener('install', (event) => {
  event.skipWaiting();
  console.log('Service Worker: Installed');
});

self.addEventListener('activate', (event) => {
  event.clients.claim();
  console.log('Service Worker: Activated');
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// --- Push Notification Handling (Conceptual - requires server-side for full implementation) ---
self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log('Service Worker: Push received', data);

  const title = data.title || 'DriveTrack Notification';
  const options = {
    body: data.body,
    icon: data.icon || 'https://placehold.co/40x40/3498db/ffffff?text=DT',
    badge: data.badge || 'https://placehold.co/40x40/3498db/ffffff?text=DT',
    data: data.data // Custom data to be used on notification click
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.notification.data);
  event.notification.close();

  // Example: Open a specific URL when notification is clicked
  const urlToOpen = event.notification.data?.url || '/'; // Default to root
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
