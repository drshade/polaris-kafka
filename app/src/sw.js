importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.0.0/workbox-sw.js');

const precacheManifest = [];

workbox.precaching.precacheAndRoute(precacheManifest);

workbox.core.skipWaiting();
workbox.core.clientsClaim();

workbox.routing.registerRoute(
  /\.(?:json)$/,
  new workbox.strategies.StaleWhileRevalidate({cacheName: 'product-catalogue',}),
  'GET'
);

self.addEventListener('push', (event) => {
  console.log(event);

  const options = {
    body: 'You have been paid',
    icon: 'assets/images/logo/icon-512x512.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [{ action: 'balance', title: 'View your balance', icon: 'images/checkmark.png' }]
  };

  event.waitUntil(self.registration.showNotification('Payment received', options));
});

self.addEventListener('notificationclick', function(e) {
  var notification = e.notification;

  if (e.action === 'close') {
    notification.close();
  } else {
    clients.openWindow('https://d289thuiw7n9ug.cloudfront.net');
    notification.close();
  }
});
