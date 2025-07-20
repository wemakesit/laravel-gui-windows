import { useState, useEffect } from 'react';
import { usePWA } from '../Hooks/usePWA';

interface OfflineStatusProps {
  className?: string;
  showWhenOnline?: boolean;
}

export default function OfflineStatus({
  className = '',
  showWhenOnline = false
}: OfflineStatusProps) {
  const {
    isOnline,
    isSyncing,
    lastSync,
    syncEstimates,
    getCachedEstimates
  } = usePWA();

  const [unsyncedCount, setUnsyncedCount] = useState(0);

  // Load cached estimates count
  useEffect(() => {
    const loadUnsyncedCount = async () => {
      try {
        const cachedEstimates = await getCachedEstimates();
        const count = cachedEstimates.filter(e => !e.synced).length;
        setUnsyncedCount(count);
      } catch (error) {
        console.error('Error loading unsynced count:', error);
        setUnsyncedCount(0);
      }
    };

    loadUnsyncedCount();
  }, [getCachedEstimates, isOnline, isSyncing]);

  // Don't show when online unless explicitly requested
  if (isOnline && !showWhenOnline && unsyncedCount === 0) {
    return null;
  }

  const handleSync = async () => {
    if (isOnline && !isSyncing) {
      await syncEstimates();
    }
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className={`${className}`}>
      {/* Offline Banner - Disabled for offline-first app */}
      {/* The app is designed to work offline, so we don't show offline warnings */}

      {/* Online Status with Sync Info - Only show when there are unsynced estimates */}
      {isOnline && unsyncedCount > 0 && (
        <div className='bg-green-50 border-l-4 border-green-400 p-4 mb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-green-400'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-sm text-green-700'>
                  <strong>You're online.</strong>
                  {unsyncedCount > 0 && (
                    <span className='ml-1'>
                      {unsyncedCount} estimate{unsyncedCount !== 1 ? 's' : ''} ready to sync.
                    </span>
                  )}
                </p>
                {lastSync && (
                  <p className='text-xs text-green-600 mt-1'>
                    Last sync: {formatLastSync(lastSync)}
                  </p>
                )}
              </div>
            </div>
            
            {unsyncedCount > 0 && (
              <div className='flex-shrink-0'>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className='inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSyncing ? (
                    <>
                      <svg
                        className='animate-spin -ml-1 mr-2 h-3 w-3 text-green-700'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        />
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg
                        className='-ml-1 mr-2 h-3 w-3'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                        />
                      </svg>
                      Sync Now
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync Status Indicator (Small) - Only show when explicitly requested */}
      {isOnline && unsyncedCount === 0 && showWhenOnline && (
        <div className='flex items-center text-xs text-gray-500 mb-2'>
          <div className='w-2 h-2 bg-green-400 rounded-full mr-2'></div>
          <span>Online • Last sync: {formatLastSync(lastSync)}</span>
        </div>
      )}
    </div>
  );
}
