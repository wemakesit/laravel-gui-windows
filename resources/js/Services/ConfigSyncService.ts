/**
 * Configuration Sync Service
 * Handles syncing configuration data from API to WatermelonDB for offline use
 */

import { watermelonDBService } from './WatermelonDBService';

export class ConfigSyncService {
  private readonly API_BASE_URL = 'http://localhost:8000/api/v1';

  /**
   * Sync all configuration data from API
   */
  async syncAllConfiguration(): Promise<void> {
    try {
      console.log('Starting configuration sync...');
      
      // Sync all configuration data in parallel
      await Promise.all([
        this.syncWindowTypes(),
        this.syncFinishes(),
        this.syncExtras(),
        this.syncCompanyInfo(),
      ]);

      console.log('Configuration sync completed successfully');
    } catch (error) {
      console.error('Configuration sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync window types from API
   */
  async syncWindowTypes(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/config/window_types`);
      if (!response.ok) {
        throw new Error(`Failed to fetch window types: ${response.statusText}`);
      }

      const data = await response.json();
      await watermelonDBService.syncWindowTypesFromAPI(data.window_types || []);
      
      console.log('Window types synced successfully');
    } catch (error) {
      console.error('Failed to sync window types:', error);
      // Don't throw - allow other syncs to continue
    }
  }

  /**
   * Sync finishes from API
   */
  async syncFinishes(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/config/finishes`);
      if (!response.ok) {
        throw new Error(`Failed to fetch finishes: ${response.statusText}`);
      }

      const data = await response.json();
      await watermelonDBService.syncFinishesFromAPI(data);
      
      console.log('Finishes synced successfully');
    } catch (error) {
      console.error('Failed to sync finishes:', error);
      // Don't throw - allow other syncs to continue
    }
  }

  /**
   * Sync extras from API
   */
  async syncExtras(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/config/extras`);
      if (!response.ok) {
        throw new Error(`Failed to fetch extras: ${response.statusText}`);
      }

      const data = await response.json();
      await watermelonDBService.syncExtrasFromAPI(data.extras || []);
      
      console.log('Extras synced successfully');
    } catch (error) {
      console.error('Failed to sync extras:', error);
      // Don't throw - allow other syncs to continue
    }
  }

  /**
   * Sync company info from API
   */
  async syncCompanyInfo(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/config/company_info`);
      if (!response.ok) {
        throw new Error(`Failed to fetch company info: ${response.statusText}`);
      }

      const data = await response.json();
      await watermelonDBService.syncCompanyInfoFromAPI(data);
      
      console.log('Company info synced successfully');
    } catch (error) {
      console.error('Failed to sync company info:', error);
      // Don't throw - allow other syncs to continue
    }
  }

  /**
   * Check if configuration data needs syncing
   * Returns true if data is stale or missing
   */
  async needsSync(): Promise<boolean> {
    try {
      const [windowTypes, extras, finishes, companyInfo] = await Promise.all([
        watermelonDBService.getCachedWindowTypes(),
        watermelonDBService.getCachedExtras(),
        watermelonDBService.getCachedFinishes(),
        watermelonDBService.getCachedCompanyInfo(),
      ]);

      // Check if any configuration is missing
      const hasWindowTypes = windowTypes.length > 0;
      const hasExtras = extras.length > 0;
      const hasFinishes = Object.keys(finishes).length > 0;
      const hasCompanyInfo = Object.keys(companyInfo).length > 0;

      return !hasWindowTypes || !hasExtras || !hasFinishes || !hasCompanyInfo;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return true; // Assume sync is needed if we can't check
    }
  }

  /**
   * Sync configuration if online and needed
   */
  async syncIfNeeded(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Offline - skipping configuration sync');
      return;
    }

    const needsSync = await this.needsSync();
    if (needsSync) {
      console.log('Configuration sync needed - starting sync...');
      await this.syncAllConfiguration();
    } else {
      console.log('Configuration is up to date - no sync needed');
    }
  }
}

// Export singleton instance
export const configSyncService = new ConfigSyncService();
export default configSyncService;
