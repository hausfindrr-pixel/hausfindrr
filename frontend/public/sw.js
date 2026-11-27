// HausFindrr Service Worker — handles push notifications only, no caching.
self.addEventListener('push', event => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { return; }

  const title = data.title || 'HausFindrr';
  const options = {
    body:  data.body  || '',
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    data:  { link: data.link || '/' },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(link);
          return;
        }
      }
      return clients.openWindow(link);
    })
  );
});
