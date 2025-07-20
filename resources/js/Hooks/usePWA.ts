import { useState, useEffect, useCallback } from 'react';
import { pwaService, PWAStatus, EstimateData } from '../Services/PWAService';

/**
 * React hook for managing PWA functionality
 */
export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>(() => pwaService.getStatus());
  const [isInstalling, setIsInstalling] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update status when online/offline changes
  useEffect(() => {
    const updateStatus = () => {
      setStatus(pwaService.getStatus());
    };

    // Subscribe to online status changes
    pwaService.onOnlineStatusChange(isOnline => {
      setStatus(prev => ({ ...prev, isOnline }));
    });

    // Subscribe to install availability changes
    pwaService.onInstallAvailable(canInstall => {
      setStatus(prev => ({ ...prev, canInstall }));
    });

    // Update status periodically
    const interval = setInterval(updateStatus, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  /**
   * Install the PWA
   */
  const installApp = useCallback(async () => {
    if (isInstalling || !status.canInstall) {
      return false;
    }

    setIsInstalling(true);
    try {
      const success = await pwaService.installApp();
      if (success) {
        setStatus(prev => ({ ...prev, canInstall: false, isInstalled: true }));
      }
      return success;
    } catch (error) {
      console.error('Error installing app:', error);
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [isInstalling, status.canInstall]);

  /**
   * Cache estimate data for offline use
   */
  const cacheEstimate = useCallback(async (estimateData: EstimateData) => {
    try {
      await pwaService.cacheEstimate(estimateData);
      return true;
    } catch (error) {
      console.error('Error caching estimate:', error);
      return false;
    }
  }, []);

  /**
   * Sync cached estimates
   */
  const syncEstimates = useCallback(async () => {
    if (isSyncing || !status.isOnline) {
      return false;
    }

    setIsSyncing(true);
    try {
      await pwaService.syncEstimates();
      setStatus(prev => ({ ...prev, lastSync: new Date() }));
      return true;
    } catch (error) {
      console.error('Error syncing estimates:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, status.isOnline]);

  /**
   * Get cached estimates
   */
  const getCachedEstimates = useCallback(async () => {
    return await pwaService.getLocalEstimates();
  }, []);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    pwaService.clearCache();
    setStatus(pwaService.getStatus());
  }, []);

  /**
   * Reset install prompt (for testing)
   */
  const resetInstallPrompt = useCallback(() => {
    pwaService.resetInstallPrompt();
    setStatus(pwaService.getStatus());
  }, []);

  /**
   * Check if estimate can be generated (online or has cached data)
   */
  const canGenerateEstimate = useCallback(() => {
    return status.isOnline; // PDF generation is online-only as specified
  }, [status.isOnline]);

  /**
   * Check if wizard can be used offline
   */
  const canUseOffline = useCallback(() => {
    // Can work on estimates offline, but cannot generate PDFs
    return status.serviceWorkerReady;
  }, [status.serviceWorkerReady]);

  return {
    // Status
    status,
    isInstalling,
    isSyncing,

    // Actions
    installApp,
    cacheEstimate,
    syncEstimates,
    getCachedEstimates,
    clearCache,
    resetInstallPrompt,

    // Utilities
    canGenerateEstimate,
    canUseOffline,

    // Computed values
    isOnline: status.isOnline,
    isOffline: !status.isOnline,
    canInstall: status.canInstall && !isInstalling,
    isInstalled: status.isInstalled,
    serviceWorkerReady: status.serviceWorkerReady,
    lastSync: status.lastSync,
  };
}
