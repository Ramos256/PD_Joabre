const CACHE_NAME = 'frota-v2';

const ASSETS = [
'/PD_Joabre/',
'/PD_Joabre/index.html',
'/PD_Joabre/manifest.json',
'/PD_Joabre/icon_joabre.svg'
];

self.addEventListener('install', (e) => {
e.waitUntil(
caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
);

self.skipWaiting();
});

self.addEventListener('activate', (e) => {
e.waitUntil(
caches.keys().then((cacheNames) =>
Promise.all(
cacheNames
.filter((name) => name !== CACHE_NAME)
.map((name) => caches.delete(name))
)
)
);

self.clients.claim();
});

self.addEventListener('fetch', (e) => {
if (e.request.method !== 'GET') return;

e.respondWith(
caches.match(e.request).then((cachedResponse) => {
return cachedResponse || fetch(e.request);
})
);
});
