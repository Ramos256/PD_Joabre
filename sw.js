const CACHE_NAME = "joabre-pd-v4";

const ASSETS = [
  "/PD_Joabre/",
  "/PD_Joabre/index.html",
  "/PD_Joabre/manifest.json",
  "/PD_Joabre/icon_joabre.svg"
];

/**
 * Instalação: guarda os ficheiros essenciais.
 */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );

  self.skipWaiting();
});

/**
 * Ativação: elimina as versões antigas da cache.
 */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

/**
 * Pedidos de rede:
 * - Não interceta POST nem outros métodos que não sejam GET.
 * - Não guarda respostas do Google Apps Script.
 * - Para os restantes pedidos, tenta a rede primeiro.
 * - Se a rede falhar, utiliza a cache.
 */
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Não intercetar pedidos a outros domínios.
  if (url.origin !== self.location.origin) {
    return;
  }

  // A aplicação tem de estar dentro do âmbito JOABRE.
  if (!url.pathname.startsWith("/PD_Joabre/")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok && response.type === "basic") {
          const copia = response.clone();

          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copia))
          );
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);

        if (cached) {
          return cached;
        }

        // Se não houver rede, apresenta o formulário guardado.
        if (request.mode === "navigate") {
          const pagina = await caches.match(
            "/PD_Joabre/index.html"
          );

          if (pagina) {
            return pagina;
          }
        }

        return new Response(
          "Sem ligação e sem ficheiro disponível na cache.",
          {
            status: 503,
            statusText: "Offline",
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      })
  );
});
