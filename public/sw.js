const CACHE_NAME = "academiapro-v1";
const URLS_TO_CACHE = [
  "/",
  "/catalogue",
  "/seances",
  "/login",
  "/inscription",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).catch(() => caches.match("/"));
    })
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "AcadémIA Pro", {
      body: data.body || "Vous avez une nouvelle notification",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    })
  );
});