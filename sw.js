// Service worker — Dark Souls Reference
// Stratégie "cache d'abord" : une fois visitée, l'appli fonctionne hors-ligne.
// À chaque changement de contenu, monter CACHE_VERSION pour forcer la mise à jour.
const CACHE_VERSION = 'dsbg-ref-v1.2';
const APP_SHELL = [
  './dark-souls-reference.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // On met chaque fichier en cache individuellement : si l'un d'eux
      // 404 ou échoue (nom renommé, casse différente...), les autres
      // sont quand même mis en cache au lieu de tout faire échouer.
      return Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[sw] échec de mise en cache pour', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});