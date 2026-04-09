const CACHE_NAME = "class-management-v1";

const urlsToCache = [
  "/ClassManagementProject/",
  "/ClassManagementProject/index.html",
  "/ClassManagementProject/sign-up-login-form/dist/style.css",
  "/ClassManagementProject/sign-up-login-form/dist/login.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});