// Service Worker minimo para que el dashboard sea instalable como PWA.
// Estrategia: network-first para HTML/JSON (siempre frescos), cache-first
// para assets estaticos. No hay datos secretos cacheados; el usuario es el
// unico que abre la app.

const CACHE = "news-dashboard-v2";
const ASSETS = [
  "./",
  "./dashboard_v2.html",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // No interceptar el proxy CORS — siempre red.
  if (url.hostname.includes("allorigins.win")) return;
  // Para todo lo demas, cache-first con fallback a red.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match("./dashboard_v2.html")))
  );
});
