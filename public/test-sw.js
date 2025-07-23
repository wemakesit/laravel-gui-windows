/**
 * Minimal Service Worker for Testing
 * This service worker provides basic functionality for Playwright tests
 */

const CACHE_NAME = 'test-cache-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/login',
  '/estimates',
  '/settings'
];

// Install event - cache basic resources
self.addEventListener('install', event => {
  console.log('Test SW: Installing service worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Test SW: Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Test SW: Cache installation failed:', error);
        // Don't fail the installation if caching fails
        return Promise.resolve();
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Test SW: Activating service worker');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Test SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control immediately
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Test SW: Serving from cache:', event.request.url);
          return response;
        }

        console.log('Test SW: Fetching from network:', event.request.url);
        return fetch(event.request).catch(error => {
          console.log('Test SW: Network fetch failed:', error);
          // Return a basic offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return new Response(
              '<html><body><h1>Offline</h1><p>This page is not available offline.</p></body></html>',
              {
                headers: { 'Content-Type': 'text/html' }
              }
            );
          }
          throw error;
        });
      })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', event => {
  console.log('Test SW: Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('Test SW: Service worker script loaded');
