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
  '/manifest.json'
  // Note: In development, Vite serves assets dynamically
  // In production, build process should populate this with actual asset paths
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

  // Skip Vite HMR and development server requests
  if (url.pathname.includes('/@vite/') ||
      url.pathname.includes('/@react-refresh') ||
      url.searchParams.has('token') ||
      url.protocol === 'ws:' ||
      url.protocol === 'wss:') {
    return;
  }

  // Handle different types of requests
  if (url.hostname === 'fonts.bunny.net' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    // External font requests - cache first with fallback
    event.respondWith(handleFontRequest(request));
  } else if (url.pathname.startsWith('/api-proxy/') || url.pathname.startsWith('/api/')) {
    // API requests - network first, cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|tsx|ts)$/)) {
    // Static assets and modules - cache first for offline-first app
    event.respondWith(handleStaticAsset(request));
  } else {
    // HTML pages - cache first for offline-first app
    event.respondWith(handlePageRequest(request));
  }
});

// Handle font requests with cache-first strategy and fallback
async function handleFontRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      // Cache successful font responses
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    // Return fallback CSS for fonts
    return new Response('/* Font loading failed - using system fonts */', {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'max-age=86400'
      }
    });
  } catch (error) {
    console.warn('Font request failed:', error);
    // Return fallback CSS
    return new Response('/* Font loading failed - using system fonts */', {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'max-age=86400'
      }
    });
  }
}

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
    // Return a proper Response object instead of throwing
    return new Response('Asset not available', {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/plain' }
    });
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

    // Return offline page if available, otherwise a basic offline response
    const offlineResponse = await getCachedResponse(new Request('/'), DYNAMIC_CACHE);
    if (offlineResponse) {
      return offlineResponse;
    }

    // For offline-first app, don't show offline page - let the app handle it
    // Return a minimal response that won't interfere with the app
    return new Response('', {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/html' }
    });
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

    if (pendingEstimates.length === 0) {
      console.log('Service Worker: No estimates to sync');
      return;
    }

    let syncedCount = 0;
    let failedCount = 0;

    for (const estimate of pendingEstimates) {
      try {
        const response = await fetch('/estimates/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': await getCSRFToken(),
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            customerInfo: estimate.customerInfo,
            windows: estimate.windows,
            selectedCaveats: estimate.selectedCaveats,
            companyInfo: estimate.companyInfo
          })
        });

        if (response.ok) {
          const result = await response.json();
          // Mark estimate as synced
          await markEstimateAsSynced(estimate.id, result);
          syncedCount++;
          console.log('Service Worker: Estimate synced successfully:', estimate.id);
        } else {
          failedCount++;
          console.error('Service Worker: Failed to sync estimate:', estimate.id, response.status);
        }
      } catch (error) {
        failedCount++;
        console.error('Service Worker: Error syncing estimate:', estimate.id, error);
      }
    }

    // Notify main thread about sync results
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: {
          synced: syncedCount,
          failed: failedCount,
          total: pendingEstimates.length
        }
      });
    });

  } catch (error) {
    console.error('Service Worker: Error in syncEstimates:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingEstimates() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['estimates'], 'readonly');
    const store = transaction.objectStore('estimates');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Service Worker: Error getting pending estimates:', error);
    return [];
  }
}

async function markEstimateAsSynced(estimateId, syncResult) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['estimates'], 'readwrite');
    const store = transaction.objectStore('estimates');

    // Get the estimate first
    const getRequest = store.get(estimateId);

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const estimate = getRequest.result;
        if (estimate) {
          estimate.synced = true;
          estimate.syncResult = syncResult;
          estimate.syncedAt = Date.now();

          const putRequest = store.put(estimate);
          putRequest.onsuccess = () => {
            console.log('Service Worker: Estimate marked as synced:', estimateId);
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(); // Estimate not found, consider it handled
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('Service Worker: Error marking estimate as synced:', error);
  }
}

async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WindowEstimateDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create estimates store if it doesn't exist
      if (!db.objectStoreNames.contains('estimates')) {
        const estimatesStore = db.createObjectStore('estimates', { keyPath: 'id' });
        estimatesStore.createIndex('timestamp', 'timestamp', { unique: false });
        estimatesStore.createIndex('synced', 'synced', { unique: false });
        estimatesStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
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
