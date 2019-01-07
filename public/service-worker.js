const cacheName = 'cache-1';
const dataCacheName = 'dataCache-1';
const filesToCache = [
  '/',
  '/index.html',
  '/scripts/app.js',
  '/scripts/idb.js',
  '/styles/inline.css',
  '/styles/animations.css',
  '/images/ic_add_white_24px.svg',
  '/images/ic_refresh_white_24px.svg',
  '/images/outline-add_a_photo-24px.svg',
  '/images/outline-add_photo_alternate-24px.svg',
  '/images/outline-add_to_home_screen-24px.svg',
  '/images/outline-cloud_upload-24px.svg'
];

self.addEventListener('install', event => {
  //   console.log('[ServiceWorker] Install');
  event.waitUntil(async () => {
    const cache = await caches.open(cacheName);
    console.log('[ServiceWorker] Caching app shell');
    await cache.addAll(filesToCache);
  });
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activates');
  event.waitUntil(async () => {
    const cacheNames = await caches.keys();
    console.log(cacheNames);
    await Promise.all(
      cacheNames
        .filter(cacheName => {
          console.log(cacheName);
          cacheName === cacheName;
        })
        .map(cacheName => caches.delete(cacheName))
    );
  });
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  //   console.log('[ServiceWorker] Fetch', event.request.url);
//   event.respondWith(async () => {
//     const cache = await caches.open(cacheName);
//     const networkResponse = await fetch(event.request.url);
//     event.waitUntil(async () => {
//       await cache.put(event.request.url, await networkResponse.clone());
//     });

//     return (await cache.match(event.request.url)) || networkResponse;
//   });
    event.waitUntil(async () => {
      console.log('cached response');

      const cachedResponse = await cache.match(event.request.url);
      console.log(cachedResponse);
      return cachedResponse;
    });

    event.waitUntil(async () => {
      console.log('network response');

      const networkResponse = await fetch(event.request.url);
      console.log(networkResponse);
      await cache.put(event.request, networkResponse.clone());
      return networkResponse;
    });

    event.waitUntil(async () => {
      const clients = await self.clients.matchAll();
      await clients.forEach(client => {
        console.log(client, 'client');
        const message = {
          type: 'refresh',
          url: event.response.url,
          eTag: event.response.headers.get('ETag')
        };
        console.log(message);
        client.postMessage(JSON.stringify(message));
      });
    });
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    return skipWaiting();
  }
});

self.addEventListener('push', event => {
  console.log(event);
  if (event.data.text() === 'new-email') {
    event.waitUntil(async () => {
      const cache = await caches.open(cacheName);
      const response = await fetch('/inbox.json');
      await cache.put('/inbox.json', response.clone());
      const emails = await response.json();
      ServiceWorkerRegistration.showNotification('New email', {
        body: 'From',
        tag: 'new-email'
      });
    });
  }
});

self.addEventListener('notificationclick', event => {
  if (event.notification.tag === 'new-email') {
    new WindowClient('/inbox/');
  }
});

self.addEventListener('sync', event => {
  if (event.id === 'update') {
    event.waitUntil(async () => {
      const cache = await caches.open(cacheName);
      await cache.add('/newdata.json');
    });
  }
});
