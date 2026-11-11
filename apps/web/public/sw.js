self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const tag = data.tag || (data.metadata && data.metadata.tag) || data.category || 'care-notification';
    const isCritical = data.priority === 'Critical';

    event.waitUntil(
      self.registration.getNotifications({ tag: tag }).then(function(existingNotifications) {
        let title = data.title;
        let body = data.body || data.message || '';

        // Grouping: If an active unread notification with this tag already exists and it is not critical
        if (existingNotifications && existingNotifications.length > 0 && !isCritical) {
          const prev = existingNotifications[0];
          const prevCount = (prev.data && prev.data.count) ? Number(prev.data.count) : 1;
          const newCount = prevCount + 1;

          // Replace title & body with grouped summary count
          title = `${newCount} unread care updates`;
          body = `${data.title}: ${body}`;

          const options = {
            body: body,
            icon: data.icon || '/icon.png',
            badge: '/badge.png',
            tag: tag,
            renotify: false, // Update in-place quietly without repeated ringing
            data: {
              url: data.actionUrl || data.url || (prev.data && prev.data.url) || '/',
              count: newCount
            },
            actions: [
              { action: 'open', title: 'View Updates' }
            ]
          };

          return self.registration.showNotification(title, options);
        }

        // First notification or critical alert
        const options = {
          body: body,
          icon: data.icon || '/icon.png',
          badge: '/badge.png',
          tag: tag,
          renotify: isCritical,
          data: {
            url: data.actionUrl || data.url || '/',
            count: 1
          },
          actions: [
            { action: 'open', title: 'View Details' }
          ]
        };

        return self.registration.showNotification(title, options);
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
