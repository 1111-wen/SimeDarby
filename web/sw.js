// Service worker: caches the app shell so the app opens quickly and installs as a PWA.
// Flood data is fetched network-first so users always get the newest prediction when online.
const CACHE = "floodsafe-v9";
const SHELL = [
  "./", "./index.html", "./css/styles.css", "./manifest.webmanifest", "./icons/icon.svg",
  "./js/app.js", "./js/config.js", "./js/flood.js", "./js/routing.js", "./js/geo.js", "./js/rain.js", "./js/sponge.js", "./js/evac.js"
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // map tiles and fonts go straight to the network
  if (url.pathname.includes("/data/")) {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
