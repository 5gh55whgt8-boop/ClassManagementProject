const CACHE_NAME = "class-management-v2";

const urlsToCache = [
  "/ClassManagementProject/",
  "/ClassManagementProject/index.html",
  "/ClassManagementProject/student-login.html",
  "/ClassManagementProject/manifest.webmanifest",

  "/ClassManagementProject/sign-up-login-form/dist/style.css",
  "/ClassManagementProject/sign-up-login-form/dist/login.js",
  "/ClassManagementProject/sign-up-login-form/dist/student-login.js",

  "/ClassManagementProject/sign-up-login-form/dist/Header/Header.css",
  "/ClassManagementProject/sign-up-login-form/dist/Header/Header.html",

  "/ClassManagementProject/sign-up-login-form/dist/HomePage/Home.css",
  "/ClassManagementProject/sign-up-login-form/dist/HomePage/Home.html",
  "/ClassManagementProject/sign-up-login-form/dist/HomePage/Home.js",

  "/ClassManagementProject/sign-up-login-form/dist/Dashboard/Dashboard.css",
  "/ClassManagementProject/sign-up-login-form/dist/Dashboard/Dashboard.html",
  "/ClassManagementProject/sign-up-login-form/dist/Dashboard/Dashboard.js",

  "/ClassManagementProject/sign-up-login-form/dist/TermWork/TermWork.css",
  "/ClassManagementProject/sign-up-login-form/dist/TermWork/TermWork.html",
  "/ClassManagementProject/sign-up-login-form/dist/TermWork/TermWork.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const requestUrl = new URL(event.request.url);

  // API requests should always go to network
  if (requestUrl.origin.includes("onrender.com")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({
            status: "error",
            message: "Network unavailable"
          }),
          {
            headers: { "Content-Type": "application/json" }
          }
        )
      )
    );
    return;
  }

  // Static assets: cache first, then network
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return (
        cachedResponse ||
        fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
      );
    })
  );
});