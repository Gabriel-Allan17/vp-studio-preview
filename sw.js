const CACHE_NAME = "vp-studio-homologacao-v24";
const APP_SHELL = [
  "./",
  "./index.html",
  "./creative.html",
  "./creative.css?v=11",
  "./creative.js?v=11",
  "./login-options.html",
  "./styles.css?v=24",
  "./experience-tokens.css?v=24",
  "./login-options.css",
  "./login-options.css?v=24",
  "./app.js?v=24",
  "./body-map.js?v=24",
  "./manifest.webmanifest",
  "./offline.html",
  "./assets/brand/vp-logo.png",
  "./assets/brand/vp-logo-gradient.png",
  "./assets/body-map/female-atlas.png",
  "./assets/body-map/male-atlas.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => (await caches.match(event.request)) || caches.match("./offline.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === "opaque") return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});
