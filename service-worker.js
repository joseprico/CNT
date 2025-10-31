// Service Worker per CN Terrassa Waterpolo Stats
const CACHE_NAME = 'cnt-waterpolo-v1';
const BASE_PATH = '/CNT';
const urlsToCache = [
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/actawp_juvenil_data.json`,
  `${BASE_PATH}/actawp_cadet_data.json`,
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://clubnatacioterrassa.cat/wp-content/uploads/CNT_Escut_Blau.png.webp'
];

// Instal·lació del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Cache error:', error);
      })
  );
  self.skipWaiting();
});

// Activació del Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estratègia de caché: Network First, falling back to Cache
self.addEventListener('fetch', event => {
  // Skip chrome extensions and non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la resposta és vàlida, clonem-la i l'emmagatzemem
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la xarxa, intentem recuperar de caché
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('[Service Worker] Serving from cache:', event.request.url);
              return cachedResponse;
            }
            // Si no hi ha caché, retornem una pàgina d'error simple
            return new Response(
              '<h1>Offline</h1><p>No hi ha connexió i aquesta pàgina no està disponible offline.</p>',
              {
                headers: { 'Content-Type': 'text/html' }
              }
            );
          });
      })
  );
});

// Sincronització en segon pla
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag);
  if (event.tag === 'sync-stats') {
    event.waitUntil(syncStatistics());
  }
});

async function syncStatistics() {
  try {
    console.log('[Service Worker] Syncing statistics...');
    // Aquí podries actualitzar les dades en segon pla
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}
