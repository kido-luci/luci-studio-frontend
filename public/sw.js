// Push-only service worker — shipped verbatim from /public, no build step.
// Deliberately does NOT add fetch/install/activate asset-caching logic: this
// worker exists only to receive web push and route notification clicks, so
// it never interferes with the static site's own caching (see _headers).

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New post';
  const options = {
    body: data.body || '',
    icon: '/images/logo_icon.png',
    data: { url: data.url },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;

  event.waitUntil(
    (async () => {
      if (!url) return;

      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })()
  );
});
