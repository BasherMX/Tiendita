const CACHE_NAME = "tiendita-cache-v3";
const APP_SHELL = [
  "/",
  "/index.html",
  "/logo.jpg",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  globalThis.skipWaiting();
});

globalThis.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  globalThis.clients.claim();
});

globalThis.addEventListener("message", (event) => {
  const sourceUrl = event.source?.url;
  if (sourceUrl) {
    const sourceOrigin = new URL(sourceUrl).origin;
    if (sourceOrigin !== globalThis.location.origin) return;
  }

  if (event.data?.type === "SKIP_WAITING") {
    globalThis.skipWaiting();
  }
});

globalThis.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === globalThis.location.origin;
  const isApiRequest =
    url.pathname.startsWith("/api/") ||
    (!isSameOrigin && url.port === "4000");

  // Never cache API traffic to avoid serving stale 401 responses.
  if (isApiRequest || !isSameOrigin) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match("/index.html"));
    }),
  );
});
