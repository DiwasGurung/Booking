// Service Worker for handling push notifications
self.addEventListener('push', function (event) {

  try {
    const data = event.data.json()
    const notification = data.notification

    const options = {
      body: notification.body,
      icon: notification.icon || '/logo.png',
      badge: notification.badge || '/badge-72x72.png',
      tag: notification.tag || 'default',
      data: notification.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open',
          icon: '/icon-open.png',
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icon-close.png',
        },
      ],
      requireInteraction: false,
    }

    event.waitUntil(self.registration.showNotification(notification.title, options))
  } catch (error) {
    console.error('[ServiceWorker] Error processing push notification:', error)
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  if (event.action === 'close') {
    return
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Handle notification dismissal
self.addEventListener('notificationclose', function (event) {
})

// Background sync (optional - for retrying failed syncs)
self.addEventListener('sync', function (event) {
  if (event.tag === 'sync-notifications') {
  }
})