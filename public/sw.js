// App-shell cache: network-first, cache fallback. Never intercepts /api/*
// (calendar, health webhook) or cross-origin requests (Supabase) — those are
// handled by the app's own IndexedDB cache/outbox instead.
const CACHE_NAME = "bens-app-shell-v2";

// Precache every tab's shell up front so a page works offline even on its
// very first visit, not only after having been opened once while online.
const APP_ROUTES = ["/events", "/growth", "/calories", "/fitness", "/rewards"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(APP_ROUTES.map((route) => cache.add(route).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/events")))
  );
});
