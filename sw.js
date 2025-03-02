// Service Worker for Sigma Toonz PWA

const CACHE_NAME = 'sigma-toonz-v1';

// Add all files that should be cached for offline use
const filesToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/folderManager.css',
  '/scripts.js',
  '/db.js',
  '/folderManager.js',
  '/pwa.js',
  '/THREE.js',
  '/ParticleBackground.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/picocss/1.4.4/pico.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
  'https://cdn.glitch.global/76036de6-7e2c-4853-b0dd-29c8cc0392b2/SigmaLogo64.png?v=1735331667279',
  'https://cdn.glitch.global/76036de6-7e2c-4853-b0dd-29c8cc0392b2/SigmaLogo192.png?v=1735330048173'
];

// Install event - cache necessary files
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(filesToCache);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting on install');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  console.log('[ServiceWorker] Fetch', event.request.url);
  
  // Skip cross-origin requests, like those for Google Analytics
  if (event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('cdn.glitch.global') ||
      event.request.url.includes('cdnjs.cloudflare.com')) {
    
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request).then(response => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // IMPORTANT: Clone the response. A response is a stream
          // and can only be consumed once. Since we want to consume it
          // in the cache and return it to the browser, we need to clone it.
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        }).catch(error => {
          // If fetch fails, display the offline page
          console.log('[ServiceWorker] Fetch failed; returning offline page instead.', error);
          
          // Only display offline content for navigate requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          
          // If we can't fetch and it's not a navigation, just return a basic offline response
          return new Response('Offline content not available');
        });
      })
    );
  }
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
}); 