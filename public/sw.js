/* Bedrock Studio — Service Worker (v4.0.0-alpha.1)
 * PWA mínima pero real: precache del app shell, cache-first para
 * assets locales, network-first con fallback a caché para navegación.
 * Los assets con hash de Vite (/assets/...) no se precachean por nombre
 * (cambian en cada build); se guardan en caché en la primera visita.
 */

const CACHE_NAME = 'bedrock-studio-v4-alpha';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo peticiones GET. El resto (POST, etc.) pasa directo a la red.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No interceptar peticiones a otros orígenes (Google Fonts, CDN de
  // iconos, API de Gemini, etc.): si no hay internet, la app usa las
  // fuentes del sistema y sigue funcionando.
  if (url.origin !== self.location.origin) return;

  // Navegación (HTML): red primero, caché como respaldo offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match('/index.html', { ignoreSearch: true })
            .then((cached) => cached || caches.match('/')),
        ),
    );
    return;
  }

  // Assets locales (JS/CSS/imágenes/fuentes del propio origen):
  // caché primero, red en segundo plano para actualizar la caché.
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
