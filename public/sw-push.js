/**
 * SmartBiz Pocket – Offline Push Notifications & Device Badge Service Worker Extension
 * Enables native push notifications, topbar notification shades, and badging without active internet.
 */

// Handle Background Push Notifications
self.addEventListener('push', function(event) {
  let payload = {
    title: 'SmartBiz Pocket Alert',
    body: 'A business transaction or reminder requires your attention.',
    tag: 'smartbiz-alert',
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (err) {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.tag || 'smartbiz-notification',
    vibrate: [200, 100, 200],
    data: payload.data || { url: '/' },
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// Handle Notification Clicks (Focus or Open App)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle App Badging Messages
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SET_BADGE') {
    if (navigator.setAppBadge) {
      navigator.setAppBadge(event.data.count).catch(function() {});
    }
  } else if (event.data && event.data.type === 'CLEAR_BADGE') {
    if (navigator.clearAppBadge) {
      navigator.clearAppBadge().catch(function() {});
    }
  }
});
