
const CACHE_NAME = "frota-v3";

const ASSETS = [
  "/PD_Joabre/",
  "/PD_Joabre/index.html",
  "/PD_Joabre/manifest.json",
  "/PD_Joabre/icon_joabre.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Não guardar respostas do Apps Script na cache da aplicação.
  if (url.hostname === "script.google.com" ||
      url.hostname === "script.googleusercontent.com") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok &&
            url.origin === self.location.origin) {
          const copia = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copia);
          });
        }

        return response;
      })
      .catch(() => caches.match(event.request).then(cached => {
        if (cached) return cached;

        if (event.request.mode === "navigate") {
          return caches.match("/PD_Joabre/index.html");
        }

        return Response.error();
      }))
  );
});
