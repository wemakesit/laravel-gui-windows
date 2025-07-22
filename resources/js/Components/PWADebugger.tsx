import React, { useState, useEffect } from 'react';
import { watermelonDBService } from '../Services/WatermelonDBService';

interface PWAStatus {
  serviceWorker: {
    registered: boolean;
    active: boolean;
    waiting: boolean;
    scope?: string;
    scriptURL?: string;
    state?: string;
  };
  manifest: {
    available: boolean;
    name?: string;
    shortName?: string;
    display?: string;
    themeColor?: string;
    icons?: number;
    error?: string;
  };
  installation: {
    installable: boolean;
    installed: boolean;
    standalone: boolean;
    platform?: string;
  };
  storage: {
    watermelonDB: boolean;
    localStorage: boolean;
    indexedDB: boolean;
    estimates?: number;
    customers?: number;
    windows?: number;
    photos?: number;
  };
  network: {
    online: boolean;
    connection?: string;
    effectiveType?: string;
  };
  cache: {
    available: boolean;
    entries?: number;
    size?: string;
  };
}

export default function PWADebugger() {
  const [status, setStatus] = useState<PWAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const checkPWAStatus = async () => {
    setLoading(true);

    try {
      const pwaStatus: PWAStatus = {
        serviceWorker: {
          registered: false,
          active: false,
          waiting: false,
        },
        manifest: {
          available: false,
        },
        installation: {
          installable: false,
          installed: false,
          standalone: window.matchMedia('(display-mode: standalone)').matches,
        },
        storage: {
          watermelonDB: false,
          localStorage: false,
          indexedDB: false,
        },
        network: {
          online: navigator.onLine,
        },
        cache: {
          available: false,
        },
      };

      // Check Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            pwaStatus.serviceWorker = {
              registered: true,
              active: !!registration.active,
              waiting: !!registration.waiting,
              scope: registration.scope,
              scriptURL: registration.active?.scriptURL,
              state: registration.active?.state,
            };
          }
        } catch (error) {
          console.error('Service Worker check failed:', error);
        }
      }

      // Check Web App Manifest
      try {
        const response = await fetch('/build/manifest.webmanifest');
        if (response.ok) {
          const manifest = await response.json();
          pwaStatus.manifest = {
            available: true,
            name: manifest.name,
            shortName: manifest.short_name,
            display: manifest.display,
            themeColor: manifest.theme_color,
            icons: manifest.icons?.length || 0,
          };
        }
      } catch (error) {
        pwaStatus.manifest.error = (error as Error).message;
      }

      // Check Installation Status
      pwaStatus.installation.platform =
        (navigator as any).userAgentData?.platform || navigator.platform;

      // Check if app is installable (this is set by beforeinstallprompt event)
      pwaStatus.installation.installable = !!(window as any).deferredPrompt;

      // Check Storage Capabilities
      pwaStatus.storage.localStorage = typeof Storage !== 'undefined';
      pwaStatus.storage.indexedDB = 'indexedDB' in window;
      pwaStatus.storage.watermelonDB = true; // WatermelonDB is always available when imported

      // Check WatermelonDB storage counts
      try {
        const storageInfo = await watermelonDBService.getStorageInfo();
        pwaStatus.storage.estimates = storageInfo.estimates;
        pwaStatus.storage.customers = storageInfo.customers;
        pwaStatus.storage.windows = storageInfo.windows;
        pwaStatus.storage.photos = storageInfo.photos;
      } catch (error) {
        console.error('WatermelonDB check failed:', error);
        pwaStatus.storage.watermelonDB = false;
      }

      // Check Network Information
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;
      if (connection) {
        pwaStatus.network.connection = connection.type;
        pwaStatus.network.effectiveType = connection.effectiveType;
      }

      // Check Cache Storage
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          pwaStatus.cache.available = cacheNames.length > 0;

          if (cacheNames.length > 0) {
            let totalSize = 0;
            let totalEntries = 0;

            for (const cacheName of cacheNames) {
              const cache = await caches.open(cacheName);
              const keys = await cache.keys();
              totalEntries += keys.length;

              // Estimate size (rough calculation)
              for (const request of keys.slice(0, 10)) {
                // Sample first 10 for performance
                try {
                  const response = await cache.match(request);
                  if (response) {
                    const blob = await response.blob();
                    totalSize += blob.size;
                  }
                } catch (error) {
                  // Ignore individual errors
                }
              }
            }

            pwaStatus.cache.entries = totalEntries;
            pwaStatus.cache.size = `~${(totalSize / 1024 / 1024).toFixed(2)} MB`;
          }
        } catch (error) {
          console.error('Cache check failed:', error);
        }
      }

      setStatus(pwaStatus);
    } catch (error) {
      console.error('PWA status check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkPWAStatus();
    setRefreshing(false);
  };

  const handleClearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        alert('Cache cleared successfully!');
        await handleRefresh();
      } catch (error) {
        alert('Failed to clear cache: ' + (error as Error).message);
      }
    }
  };

  const handleUpdateServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          alert('Service Worker update triggered!');
          await handleRefresh();
        }
      } catch (error) {
        alert('Failed to update Service Worker: ' + (error as Error).message);
      }
    }
  };

  useEffect(() => {
    checkPWAStatus();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Checking PWA status...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className='text-center py-12'>
        <p className='text-red-600'>Failed to check PWA status</p>
        <button
          onClick={handleRefresh}
          className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        >
          Retry
        </button>
      </div>
    );
  }

  const StatusIndicator = ({
    status: isGood,
    label,
  }: {
    status: boolean;
    label: string;
  }) => (
    <div className='flex items-center space-x-2'>
      <div
        className={`w-3 h-3 rounded-full ${isGood ? 'bg-green-500' : 'bg-red-500'}`}
      ></div>
      <span className={isGood ? 'text-green-700' : 'text-red-700'}>
        {label}
      </span>
    </div>
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold text-gray-900'>PWA Diagnostics</h3>
        <div className='space-x-2'>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className='px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm'
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleClearCache}
            className='px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm'
          >
            Clear Cache
          </button>
          <button
            onClick={handleUpdateServiceWorker}
            className='px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm'
          >
            Update SW
          </button>
        </div>
      </div>

      {/* Status Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Service Worker Status */}
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='font-medium text-gray-900 mb-3'>Service Worker</h4>
          <div className='space-y-2 text-sm'>
            <StatusIndicator
              status={status.serviceWorker.registered}
              label='Registered'
            />
            <StatusIndicator
              status={status.serviceWorker.active}
              label='Active'
            />
            {status.serviceWorker.scope && (
              <p className='text-gray-600 text-xs'>
                Scope: {status.serviceWorker.scope}
              </p>
            )}
            {status.serviceWorker.state && (
              <p className='text-gray-600 text-xs'>
                State: {status.serviceWorker.state}
              </p>
            )}
          </div>
        </div>

        {/* Manifest Status */}
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='font-medium text-gray-900 mb-3'>Web App Manifest</h4>
          <div className='space-y-2 text-sm'>
            <StatusIndicator
              status={status.manifest.available}
              label='Available'
            />
            {status.manifest.name && (
              <p className='text-gray-600 text-xs'>
                Name: {status.manifest.name}
              </p>
            )}
            {status.manifest.display && (
              <p className='text-gray-600 text-xs'>
                Display: {status.manifest.display}
              </p>
            )}
            {status.manifest.icons && (
              <p className='text-gray-600 text-xs'>
                Icons: {status.manifest.icons}
              </p>
            )}
            {status.manifest.error && (
              <p className='text-red-600 text-xs'>
                Error: {status.manifest.error}
              </p>
            )}
          </div>
        </div>

        {/* Installation Status */}
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='font-medium text-gray-900 mb-3'>Installation</h4>
          <div className='space-y-2 text-sm'>
            <StatusIndicator
              status={status.installation.standalone}
              label='Standalone Mode'
            />
            <StatusIndicator
              status={status.installation.installable}
              label='Installable'
            />
            {status.installation.platform && (
              <p className='text-gray-600 text-xs'>
                Platform: {status.installation.platform}
              </p>
            )}
          </div>
        </div>

        {/* Storage Status */}
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='font-medium text-gray-900 mb-3'>Storage</h4>
          <div className='space-y-2 text-sm'>
            <StatusIndicator
              status={status.storage.localStorage}
              label='Local Storage'
            />
            <StatusIndicator
              status={status.storage.indexedDB}
              label='IndexedDB'
            />
            <StatusIndicator status={status.storage.watermelonDB} label='WatermelonDB' />
            <div className='text-gray-600 text-xs space-y-1'>
              {status.storage.estimates !== undefined && (
                <p>Estimates: {status.storage.estimates}</p>
              )}
              {status.storage.customers !== undefined && (
                <p>Customers: {status.storage.customers}</p>
              )}
              {status.storage.windows !== undefined && (
                <p>Windows: {status.storage.windows}</p>
              )}
              {status.storage.photos !== undefined && (
                <p>Photos: {status.storage.photos}</p>
              )}
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='font-medium text-gray-900 mb-3'>Network</h4>
          <div className='space-y-2 text-sm'>
            <StatusIndicator status={status.network.online} label='Online' />
            {status.network.connection && (
              <p className='text-gray-600 text-xs'>
                Type: {status.network.connection}
              </p>
            )}
            {status.network.effectiveType && (
              <p className='text-gray-600 text-xs'>
                Speed: {status.network.effectiveType}
              </p>
            )}
          </div>
        </div>

        {/* Cache Status */}
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h4 className='font-medium text-gray-900 mb-3'>Cache Storage</h4>
          <div className='space-y-2 text-sm'>
            <StatusIndicator
              status={status.cache.available}
              label='Available'
            />
            {status.cache.entries && (
              <p className='text-gray-600 text-xs'>
                Entries: {status.cache.entries}
              </p>
            )}
            {status.cache.size && (
              <p className='text-gray-600 text-xs'>Size: {status.cache.size}</p>
            )}
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className='bg-blue-50 p-4 rounded-lg'>
        <h4 className='font-medium text-blue-900 mb-2'>Overall PWA Status</h4>
        <div className='text-sm text-blue-800'>
          {status.serviceWorker.registered && status.manifest.available ? (
            <p>✅ PWA is properly configured and functional</p>
          ) : (
            <p>⚠️ PWA has some issues that need attention</p>
          )}
        </div>
      </div>
    </div>
  );
}
