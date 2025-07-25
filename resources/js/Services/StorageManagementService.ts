/**
 * Storage Management Service
 * Handles storage quota issues and cleanup for WatermelonDB and browser storage
 */

import { watermelonDBService } from './WatermelonDBService';

export class StorageManagementService {
  private static readonly STORAGE_QUOTA_THRESHOLD = 0.8; // 80% of quota
  private static readonly CLEANUP_BATCH_SIZE = 50;

  /**
   * Check current storage usage
   */
  static async getStorageInfo(): Promise<{
    quota: number;
    usage: number;
    available: number;
    percentage: number;
  }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        const available = quota - usage;
        const percentage = quota > 0 ? usage / quota : 0;

        return {
          quota,
          usage,
          available,
          percentage,
        };
      }
    } catch (error) {
      console.warn('Storage estimation not available:', error);
    }

    // Fallback for browsers without storage estimation
    return {
      quota: 0,
      usage: 0,
      available: 0,
      percentage: 0,
    };
  }

  /**
   * Check if storage is approaching quota limit
   */
  static async isStorageNearQuota(): Promise<boolean> {
    const info = await this.getStorageInfo();
    return info.percentage > this.STORAGE_QUOTA_THRESHOLD;
  }

  /**
   * Clear browser storage (localStorage, sessionStorage, IndexedDB)
   */
  static async clearBrowserStorage(): Promise<void> {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();

      // Clear IndexedDB databases
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise<void>((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!);
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
            return Promise.resolve();
          })
        );
      }

      // Browser storage cleared successfully
    } catch (error) {
      console.error('Failed to clear browser storage:', error);
      throw error;
    }
  }

  /**
   * Clear WatermelonDB data
   */
  static async clearWatermelonDB(): Promise<void> {
    try {
      await watermelonDBService.clearAllData();
      // WatermelonDB data cleared successfully
    } catch (error) {
      console.error('Failed to clear WatermelonDB:', error);
      throw error;
    }
  }

  /**
   * Perform cleanup when storage quota is exceeded
   */
  static async performStorageCleanup(): Promise<{
    success: boolean;
    message: string;
    clearedSpace: number;
  }> {
    try {
      const beforeInfo = await this.getStorageInfo();
      
      // Clear old cached data first
      await this.clearOldCachedData();
      
      // If still near quota, clear WatermelonDB data
      if (await this.isStorageNearQuota()) {
        await this.clearWatermelonDB();
      }
      
      // If still near quota, clear all browser storage
      if (await this.isStorageNearQuota()) {
        await this.clearBrowserStorage();
      }

      const afterInfo = await this.getStorageInfo();
      const clearedSpace = beforeInfo.usage - afterInfo.usage;

      return {
        success: true,
        message: `Storage cleanup completed. Cleared ${this.formatBytes(clearedSpace)} of data.`,
        clearedSpace,
      };
    } catch (error) {
      return {
        success: false,
        message: `Storage cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        clearedSpace: 0,
      };
    }
  }

  /**
   * Clear old cached data (older than 7 days)
   */
  private static async clearOldCachedData(): Promise<void> {
    try {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      // Clear old localStorage entries
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (parsed.timestamp && parsed.timestamp < sevenDaysAgo) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // If parsing fails, consider it old data
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Cleared old localStorage entries
    } catch (error) {
      console.warn('Failed to clear old cached data:', error);
    }
  }

  /**
   * Format bytes to human readable format
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Monitor storage and perform cleanup if needed
   */
  static async monitorStorage(): Promise<void> {
    try {
      if (await this.isStorageNearQuota()) {
        console.warn('Storage quota approaching limit, performing cleanup...');
        const result = await this.performStorageCleanup();
        
        if (result.success) {
          console.log(result.message);
        } else {
          console.error(result.message);
        }
      }
    } catch (error) {
      console.error('Storage monitoring failed:', error);
    }
  }

  /**
   * Handle quota exceeded error
   */
  static async handleQuotaExceeded(): Promise<boolean> {
    try {
      console.warn('Storage quota exceeded, attempting cleanup...');
      const result = await this.performStorageCleanup();
      
      if (result.success) {
        // Show user-friendly message
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(
            'Storage space was running low and has been cleaned up. ' +
            'Some offline data may have been removed to free up space.'
          );
        }
        return true;
      } else {
        // Show error message
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(
            'Storage space is full and cleanup failed. ' +
            'Please clear your browser data manually or contact support.'
          );
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to handle quota exceeded:', error);
      return false;
    }
  }

  /**
   * Initialize storage monitoring
   */
  static initializeStorageMonitoring(): void {
    // Monitor storage every 5 minutes
    setInterval(() => {
      this.monitorStorage();
    }, 5 * 60 * 1000);

    // Handle quota exceeded errors globally
    window.addEventListener('error', (event) => {
      if (event.error?.message?.includes('quota exceeded') || 
          event.error?.name === 'QuotaExceededError') {
        event.preventDefault();
        this.handleQuotaExceeded();
      }
    });

    // Handle unhandled promise rejections for quota errors
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('quota exceeded') || 
          event.reason?.name === 'QuotaExceededError') {
        event.preventDefault();
        this.handleQuotaExceeded();
      }
    });
  }
}

export default StorageManagementService;
