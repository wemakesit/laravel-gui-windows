/**
 * PWA Service for managing offline functionality, service worker, and app installation
 */

import { indexedDBService, EstimateRecord } from './IndexedDBService';
import { Workbox } from 'workbox-window';

export interface PWAStatus {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  serviceWorkerReady: boolean;
  lastSync?: Date;
}

export interface EstimateData {
  id?: string;
  customerInfo: any;
  windows: any[];
  selectedCaveats: any;
  companyInfo?: any;
  timestamp: number;
  synced: boolean;
}

class PWAService {
  private wb: Workbox | null = null;
  private serviceWorker: ServiceWorker | null = null;
  private installPrompt: any = null;
  private onlineStatusCallbacks: ((isOnline: boolean) => void)[] = [];
  private installCallbacks: ((canInstall: boolean) => void)[] = [];

  constructor() {
    console.log('PWA: PWAService constructor called');
    this.init();
  }

  /**
   * Initialize PWA service
   */
  private async init() {
    console.log('PWA: Initializing PWA Service...');

    // Check if we're in a secure context (HTTPS or localhost)
    if (!this.isSecureContext()) {
      console.log(
        'PWA: Service workers require HTTPS or localhost. Current origin:',
        window.location.origin
      );
      console.log(
        'PWA: For development, please use localhost instead of 0.0.0.0 or use HTTPS'
      );
      console.log(
        'PWA: Skipping service worker registration in insecure context'
      );
      return;
    }

    // Register service worker using Workbox (check if sw.js exists)
    if ('serviceWorker' in navigator) {
      try {
        // Check if we're in development mode
        const isDevelopment = import.meta.env.DEV;

        if (isDevelopment) {
          console.log(
            'PWA: Development mode detected - service worker functionality limited'
          );
          console.log(
            'PWA: Service worker will be available after building the application'
          );
          // In development, we can still register basic offline functionality
          // but skip the full service worker registration
          return;
        }

        console.log('PWA: Registering service worker with Workbox...');
        this.wb = new Workbox('/sw.js');

        this.wb.addEventListener('installed', event => {
          console.log('PWA: Service worker installed', event);
        });

        this.wb.addEventListener('waiting', event => {
          console.log('PWA: Service worker waiting', event);
          // Show update available notification
        });

        this.wb.addEventListener('controlling', event => {
          console.log('PWA: Service worker controlling', event);
          window.location.reload();
        });

        await this.wb.register();
        console.log('PWA: Service Worker registered successfully with Workbox');

        // Get the service worker instance
        const registration = await navigator.serviceWorker.ready;
        this.serviceWorker = registration.active;
      } catch (error) {
        console.error('PWA: Service Worker registration failed:', error);
        console.log(
          'PWA: This is normal in development mode - service worker will be available after build'
        );
      }
    } else {
      console.log('PWA: Service worker not supported in this browser');
    }

    // Listen for online/offline events
    window.addEventListener('online', () =>
      this.handleOnlineStatusChange(true)
    );
    window.addEventListener('offline', () =>
      this.handleOnlineStatusChange(false)
    );

    // Listen for app install prompt
    window.addEventListener('beforeinstallprompt', e => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      this.installPrompt = e;
      this.notifyInstallCallbacks(true);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed successfully');
      this.installPrompt = null;
      localStorage.setItem('pwa_install_dismissed', 'true');
      this.notifyInstallCallbacks(false);
    });
  }

  /**
   * Get current PWA status
   */
  public getStatus(): PWAStatus {
    return {
      isOnline: navigator.onLine,
      isInstalled: this.isAppInstalled(),
      canInstall: this.installPrompt !== null,
      serviceWorkerReady: this.serviceWorker !== null,
      lastSync: this.getLastSyncTime(),
    };
  }

  /**
   * Check if app is installed
   */
  private isAppInstalled(): boolean {
    // Check if running in standalone mode (PWA installed)
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;

    // Check iOS standalone mode
    const isIOSStandalone = (window.navigator as any).standalone === true;

    // Check if launched from home screen (Android)
    const isAndroidStandalone = window.matchMedia(
      '(display-mode: minimal-ui)'
    ).matches;

    // Check if the beforeinstallprompt was dismissed recently
    const wasPromptDismissed = this.wasInstallPromptRecentlyDismissed();

    // Check if we're in a WebView or app context
    const userAgent = navigator.userAgent.toLowerCase();
    const isWebView = userAgent.includes('wv') || userAgent.includes('webview');

    console.log('PWA: Install detection:', {
      isStandalone,
      isIOSStandalone,
      isAndroidStandalone,
      wasPromptDismissed,
      isWebView,
      displayMode: window.matchMedia('(display-mode: standalone)').matches
        ? 'standalone'
        : 'browser',
    });

    return isStandalone || isIOSStandalone || isAndroidStandalone || isWebView;
  }

  /**
   * Install the PWA
   */
  public async installApp(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('PWA: Install prompt not available');
      return false;
    }

    try {
      const result = await this.installPrompt.prompt();
      console.log('PWA: Install prompt result:', result);

      if (result.outcome === 'accepted') {
        this.installPrompt = null;
        localStorage.setItem('pwa_install_dismissed', 'true');
        this.notifyInstallCallbacks(false);
        return true;
      } else if (result.outcome === 'dismissed') {
        // User dismissed the prompt, don't show it again for a while
        localStorage.setItem('pwa_install_dismissed', 'true');
        localStorage.setItem(
          'pwa_install_dismissed_time',
          Date.now().toString()
        );
      }

      return false;
    } catch (error) {
      console.error('PWA: Error during app installation:', error);
      return false;
    }
  }

  /**
   * Cache estimate data for offline use
   */
  public async cacheEstimate(estimateData: EstimateData): Promise<void> {
    try {
      const estimateRecord: EstimateRecord = {
        id: estimateData.id || `offline-${Date.now()}`,
        customerInfo: estimateData.customerInfo,
        windows: estimateData.windows,
        selectedCaveats: estimateData.selectedCaveats,
        companyInfo: estimateData.companyInfo || {},
        timestamp: estimateData.timestamp,
        synced: estimateData.synced,
        lastModified: Date.now(),
        status: estimateData.synced ? 'synced' : 'draft',
      };

      await indexedDBService.saveEstimate(estimateRecord);

      // Also store in localStorage as fallback for older browsers
      const estimates = this.getLocalEstimates();
      const existingIndex = estimates.findIndex(e => e.id === estimateData.id);
      if (existingIndex >= 0) {
        estimates[existingIndex] = estimateData;
      } else {
        estimates.push(estimateData);
      }
      localStorage.setItem('cached_estimates', JSON.stringify(estimates));

      console.log(
        'PWA: Estimate cached successfully in IndexedDB and localStorage'
      );
    } catch (error) {
      console.error('PWA: Error caching estimate:', error);
      // Fallback to localStorage only
      const estimates = this.getLocalEstimates();
      estimates.push(estimateData);
      localStorage.setItem('cached_estimates', JSON.stringify(estimates));
    }
  }

  /**
   * Get cached estimates from IndexedDB and localStorage
   */
  public async getLocalEstimates(): Promise<EstimateData[]> {
    try {
      // Try IndexedDB first
      const indexedDBEstimates = await indexedDBService.getAllEstimates();
      if (indexedDBEstimates.length > 0) {
        return indexedDBEstimates.map(record => ({
          id: record.id,
          customerInfo: record.customerInfo,
          windows: record.windows,
          selectedCaveats: record.selectedCaveats,
          companyInfo: record.companyInfo,
          timestamp: record.timestamp,
          synced: record.synced,
        }));
      }

      // Fallback to localStorage
      const cached = localStorage.getItem('cached_estimates');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('PWA: Error getting local estimates:', error);
      // Final fallback to localStorage
      try {
        const cached = localStorage.getItem('cached_estimates');
        return cached ? JSON.parse(cached) : [];
      } catch (fallbackError) {
        console.error('PWA: Error with localStorage fallback:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Get cached estimates from local storage (synchronous fallback)
   */
  public getLocalEstimatesSync(): EstimateData[] {
    try {
      const cached = localStorage.getItem('cached_estimates');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('PWA: Error getting local estimates:', error);
      return [];
    }
  }

  /**
   * Sync cached estimates when online
   */
  public async syncEstimates(): Promise<void> {
    if (!navigator.onLine) {
      console.log('PWA: Cannot sync - offline');
      return;
    }

    try {
      // Get unsynced estimates from IndexedDB
      const unsyncedEstimates = await indexedDBService.getUnsyncedEstimates();

      if (unsyncedEstimates.length === 0) {
        // Fallback to localStorage
        const localEstimates = this.getLocalEstimatesSync();
        const unsyncedLocal = localEstimates.filter(e => !e.synced);
        if (unsyncedLocal.length === 0) {
          console.log('PWA: No estimates to sync');
          return;
        }
      }

      console.log(`PWA: Syncing ${unsyncedEstimates.length} estimates`);

      for (const estimate of unsyncedEstimates) {
        try {
          const response = await fetch('/estimates/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': this.getCSRFToken(),
            },
            body: JSON.stringify(estimate),
          });

          if (response.ok) {
            // Mark as synced
            estimate.synced = true;
            this.updateLocalEstimate(estimate);
            console.log('PWA: Estimate synced successfully:', estimate.id);
          }
        } catch (error) {
          console.error('PWA: Error syncing estimate:', error);
        }
      }

      // Update last sync time
      localStorage.setItem('last_sync', new Date().toISOString());
    } catch (error) {
      console.error('PWA: Error in syncEstimates:', error);
    }
  }

  /**
   * Update local estimate
   */
  private updateLocalEstimate(updatedEstimate: EstimateData): void {
    const estimates = this.getLocalEstimatesSync();
    const index = estimates.findIndex(e => e.id === updatedEstimate.id);

    if (index !== -1) {
      estimates[index] = updatedEstimate;
      localStorage.setItem('cached_estimates', JSON.stringify(estimates));
    }
  }

  /**
   * Get CSRF token
   */
  private getCSRFToken(): string {
    const metaToken = document.querySelector(
      'meta[name="csrf-token"]'
    ) as HTMLMetaElement;
    return metaToken ? metaToken.content : '';
  }

  /**
   * Get last sync time
   */
  private getLastSyncTime(): Date | undefined {
    const lastSync = localStorage.getItem('last_sync');
    return lastSync ? new Date(lastSync) : undefined;
  }

  /**
   * Handle online status change
   */
  private handleOnlineStatusChange(isOnline: boolean): void {
    console.log('PWA: Online status changed:', isOnline);

    if (isOnline) {
      // Trigger sync when coming back online
      this.syncEstimates();
    }

    this.onlineStatusCallbacks.forEach(callback => callback(isOnline));
  }

  /**
   * Handle service worker update
   */
  private handleServiceWorkerUpdate(
    registration: ServiceWorkerRegistration
  ): void {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (
        newWorker.state === 'installed' &&
        navigator.serviceWorker.controller
      ) {
        // New service worker is available
        console.log('PWA: New service worker available');

        // Optionally show update notification to user
        this.showUpdateNotification();
      }
    });
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    // This could trigger a UI notification
    console.log('PWA: App update available');

    // For now, just reload after a delay
    setTimeout(() => {
      if (confirm('A new version of the app is available. Reload to update?')) {
        window.location.reload();
      }
    }, 1000);
  }

  /**
   * Subscribe to online status changes
   */
  public onOnlineStatusChange(callback: (isOnline: boolean) => void): void {
    this.onlineStatusCallbacks.push(callback);
  }

  /**
   * Subscribe to install availability changes
   */
  public onInstallAvailable(callback: (canInstall: boolean) => void): void {
    this.installCallbacks.push(callback);
  }

  /**
   * Notify install callbacks
   */
  private notifyInstallCallbacks(canInstall: boolean): void {
    this.installCallbacks.forEach(callback => callback(canInstall));
  }

  /**
   * Clear cached data
   */
  public clearCache(): void {
    localStorage.removeItem('cached_estimates');
    localStorage.removeItem('last_sync');

    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    console.log('PWA: Cache cleared');
  }

  /**
   * Check if install prompt was recently dismissed
   */
  private wasInstallPromptRecentlyDismissed(): boolean {
    const dismissed = localStorage.getItem('pwa_install_dismissed') === 'true';
    const dismissedTime = localStorage.getItem('pwa_install_dismissed_time');

    if (!dismissed || !dismissedTime) {
      return false;
    }

    // Allow showing prompt again after 7 days
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const timeSinceDismissal = Date.now() - parseInt(dismissedTime);

    if (timeSinceDismissal > sevenDaysInMs) {
      // Reset dismissal after 7 days
      localStorage.removeItem('pwa_install_dismissed');
      localStorage.removeItem('pwa_install_dismissed_time');
      return false;
    }

    return true;
  }

  /**
   * Check if we're in a secure context for service workers
   */
  private isSecureContext(): boolean {
    // Service workers require HTTPS or localhost
    return (
      window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.protocol === 'https:'
    );
  }

  /**
   * Reset install prompt (useful for testing)
   */
  public resetInstallPrompt(): void {
    localStorage.removeItem('pwa_install_dismissed');
    localStorage.removeItem('pwa_install_dismissed_time');
    console.log('PWA: Install prompt reset');
  }
}

// Export singleton instance
export const pwaService = new PWAService();
