const CACHE_NAME = "proxigaz-manager-v1"; // bump : purge tous les caches précédents à l'activation
const API_HOST = "proxygaz-backend.vercel.app";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(noms.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Jamais de cache pour les appels API — les données (stock, statuts, commandes) doivent
  // toujours être fraîches, jamais servies depuis un cache obsolète.
  if (url.hostname === API_HOST || url.pathname.startsWith("/api/")) {
    return; // laisse passer normalement, sans intervention du service worker
  }

  // Seules les requêtes GET same-origin sont mises en cache
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Le manifeste PWA doit TOUJOURS être resservi depuis le réseau : mis en cache, une
  // ancienne version resterait servie indéfiniment et empêcherait le navigateur de
  // reconnaître correctement l'app comme installable (display standalone, icônes...).
  if (url.pathname === "/manifest.webmanifest") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Navigation (chargement de page) : réseau en priorité, repli sur le cache si hors-ligne
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copie));
          return reponse;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Assets statiques (JS, CSS, polices, icônes) : cache d'abord, mise à jour en arrière-plan
  event.respondWith(
    caches.match(event.request).then((reponseCache) => {
      const fetchPromise = fetch(event.request)
        .then((reponseReseau) => {
          const copie = reponseReseau.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copie));
          return reponseReseau;
        })
        .catch(() => reponseCache);

      return reponseCache || fetchPromise;
    })
  );
});
