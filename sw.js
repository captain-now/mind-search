const CACHE_PREFIX = 'mind-search-pwa-';
const CACHE = CACHE_PREFIX + 'homepage-v3-0-quote-metrics-20261120';
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
  const isHomeNavigation = request.mode === 'navigate' &&
    HOME_PAGES.some(path => url.pathname === new URL(path, scope).pathname);
  const network = isHomeNavigation ? fetch(request, {cache: 'reload'}) : fetch(request);
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
    if (request.mode === 'navigate') {
      const home = await cache.match('./index.html');
      if (home) return home;
    }
    return Response.error();
  }));
});
