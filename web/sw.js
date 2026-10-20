// Service worker: caches the app shell so the app opens quickly and installs as a PWA.
// Uses network-first so changes and telemetry always stay in sync when connected, with offline cache fallback.
const CACHE = "floodsafe-v10";
const SHELL = [
  "./", "./index.html", "./css/styles.css", "./manifest.webmanifest", "./icons/icon.svg",
  "./js/app.js", "./js/config.js", "./js/flood.js", "./js/routing.js", "./js/geo.js", "./js/rain.js", "./js/sponge.js", "./js/evac.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // Map tiles and CDN assets bypass service worker

  // Network-first strategy: always fetch the latest file from server, update cache, fall back to cache when offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
