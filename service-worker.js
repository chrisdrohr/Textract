const version = 1;
const cacheName = 'cache_' + version;
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
  '/images/outline-cloud_upload-24px.svg',
  '/images/outline-share-24px.svg'
];

self.addEventListener('install', event => {
  // console.log('[ServiceWorker] Install');
  event.waitUntil(cacheAppShell());
});

cacheAppShell = async () => {
  const cache = await caches.open(cacheName);
  // console.log('[ServiceWorker] Caching app shell');
  return cache
    .addAll(filesToCache)
    .then(() => console.log('[ServiceWorker] app shell cached'));
};

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activates');
  event.waitUntil(deleteCache());
  return self.clients.claim();
});
deleteCache = async () => {
  const cacheNames = await caches.keys();
  console.log(cacheNames);
  cacheNames.map(cache => {
    if (cache !== cacheName) {
      console.log('[ServiceWorker] Clearing Old Cache');
      return caches
        .delete(cache)
        .then(() => console.log('[ServiceWorker] caches deleted'));
    }
  });
};

self.addEventListener('fetch', event => {
  // console.log('[ServiceWorker] Fetch');
  if (event.request.method === 'GET') {
    event.respondWith(fromCache(event.request));
    event.waitUntil(update(event.request).then(refresh(event.request)));
  }
});
fromCache = async request => {
  const cache = await caches.open(cacheName);
  return cache.match(request);
};
update = async request => {
  const response = await fetch(request);
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
};

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    return skipWaiting();
  }
});
refresh = async response => {
  const clients = await self.clients.matchAll();
  await clients.forEach(client => {
    const message = {
      type: 'refresh',
      url: response.url,
      eTag: response.headers.get('ETag')
    };
    client.postMessage(JSON.stringify(message));
  });
};
// self.addEventListener('push', event => {
//   console.log(event);
//   if (event.data.text() === 'new-email') {
//     event.waitUntil(async () => {
//       const cache = await caches.open(cacheName);
//       const response = await fetch('/inbox.json');
//       await cache.put('/inbox.json', response.clone());
//       const emails = await response.json();
//       ServiceWorkerRegistration.showNotification('New email', {
//         body: 'From',
//         tag: 'new-email'
//       });
//     });
//   }
// });

// self.addEventListener('notificationclick', event => {
//   if (event.notification.tag === 'new-email') {
//     new WindowClient('/inbox/');
//   }
// });

// self.addEventListener('sync', event => {
//   if (event.id === 'update') {
//     event.waitUntil(async () => {
//       const cache = await caches.open(cacheName);
//       await cache.add('/newdata.json');
//     });
//   }
// });
