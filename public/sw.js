// Service Worker for Window Estimate System
// Provides offline functionality and caching strategies

const CACHE_NAME = 'window-estimate-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/estimates',
  '/estimates/create',
  '/settings',
  '/manifest.json',
  // Add critical CSS and JS files - these will be populated by Vite
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/address-config',
  '/api-proxy/api/v1/config/window_types',
  '/api-proxy/api/v1/config/extras',
  '/api-proxy/api/v1/config/finishes',
  '/api-proxy/api/v1/config/company_info',
  '/api-proxy/api/v1/config/pdf_text_config',
  '/api-proxy/api/v1/config/options'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api-proxy/') || url.pathname.startsWith('/api/')) {
    // API requests - network first, cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    // Static assets - cache first
    event.respondWith(handleStaticAsset(request));
  } else {
    // HTML pages - network first, cache fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for configuration endpoints
      if (API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    // If network fails, try cache
    return await getCachedResponse(request, API_CACHE);
  } catch (error) {
    console.log('Service Worker: Network failed for API request, trying cache');
    return await getCachedResponse(request, API_CACHE);
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    // Try cache first
    const cachedResponse = await getCachedResponse(request, STATIC_CACHE);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Error handling static asset:', error);
    // Return a fallback response or let it fail
    throw error;
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the page
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    return await getCachedResponse(request, DYNAMIC_CACHE);
  } catch (error) {
    console.log('Service Worker: Network failed for page request, trying cache');
    const cachedResponse = await getCachedResponse(request, DYNAMIC_CACHE);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page if available
    return await getCachedResponse(new Request('/'), DYNAMIC_CACHE);
  }
}

// Helper function to get cached response
async function getCachedResponse(request, cacheName) {
  const cache = await caches.open(cacheName);
  return await cache.match(request);
}

// Background sync for when connectivity returns
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'estimate-sync') {
    event.waitUntil(syncEstimates());
  }
});

// Sync estimates when connectivity returns
async function syncEstimates() {
  console.log('Service Worker: Syncing estimates...');
  
  try {
    // Get pending estimates from IndexedDB
    const pendingEstimates = await getPendingEstimates();
    
    for (const estimate of pendingEstimates) {
      try {
        const response = await fetch('/estimates/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': await getCSRFToken()
          },
          body: JSON.stringify(estimate.data)
        });
        
        if (response.ok) {
          // Mark estimate as synced
          await markEstimateAsSynced(estimate.id);
          console.log('Service Worker: Estimate synced successfully:', estimate.id);
        }
      } catch (error) {
        console.error('Service Worker: Error syncing estimate:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Error in syncEstimates:', error);
  }
}

// Helper functions for IndexedDB operations (to be implemented)
async function getPendingEstimates() {
  // This will be implemented when we add IndexedDB
  return [];
}

async function markEstimateAsSynced(estimateId) {
  // This will be implemented when we add IndexedDB
  console.log('Marking estimate as synced:', estimateId);
}

async function getCSRFToken() {
  // Get CSRF token from meta tag or API
  try {
    const response = await fetch('/sanctum/csrf-cookie');
    const cookies = response.headers.get('set-cookie');
    // Extract CSRF token from cookies or use meta tag
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    return metaToken ? metaToken.getAttribute('content') : '';
  } catch (error) {
    console.error('Service Worker: Error getting CSRF token:', error);
    return '';
  }
}

// Message handling for communication with main thread
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_ESTIMATE':
      cacheEstimate(data);
      break;
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
    default:
      console.log('Service Worker: Unknown message type:', type);
  }
});

// Cache estimate data locally
async function cacheEstimate(estimateData) {
  try {
    // Store in IndexedDB (to be implemented)
    console.log('Service Worker: Caching estimate data:', estimateData);
  } catch (error) {
    console.error('Service Worker: Error caching estimate:', error);
  }
}

// Get cache status
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {
    caches: cacheNames,
    online: navigator.onLine
  };
  return status;
}
