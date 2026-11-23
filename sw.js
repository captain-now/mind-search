const CACHE_PREFIX = 'mind-search-pwa-';
const CACHE = CACHE_PREFIX + 'video-heart-refresh-20261123-1951';
const HOME_PAGES = ['./', './index.html'];
const ASSETS = [
  './ui-language.js?v=ko-only-1',
  './manifest.webmanifest?v=now-mind-search',
  './favicon.ico?v=now-clear-circle',
  './icons/now-32.png?v=now-clear-circle',
  './icons/now-192.png?v=now-clear-circle',
  './icons/now-192.png',
  './icons/now-512.png?v=now-clear-circle',
  './icons/now-maskable-512.png?v=now-clear-circle'
];

self.addEventListener('install', event => {
  const homeRequests = HOME_PAGES.map(path => new Request(
    new URL(path, self.registration.scope),
    {cache: 'reload'}
  ));
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll([...homeRequests, ...ASSETS]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const scope = self.registration.scope;
  // Always revalidate HTML navigations against the network, bypassing stale HTTP cache.
  const isNavigation = request.mode === 'navigate';
  const network = isNavigation ? fetch(request, {cache: 'reload'}) : fetch(request);
  event.respondWith(network.then(response => {
    if (response.ok && url.href.startsWith(scope)) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
    }
    return response;
  }).catch(async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request);
    if (hit) return hit;
    return Response.error();
  }));
});
