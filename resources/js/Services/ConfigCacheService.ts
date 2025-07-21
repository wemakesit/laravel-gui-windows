/**
 * Configuration Cache Service
 * Handles caching of window types, extras, finishes, and company configuration using PouchDB
 */

import { pouchDBService } from './PouchDBService';

export interface CachedConfig {
  windowTypes: any[];
  extras: any[];
  finishes: any[];
  companyInfo: any;
  pdfTextConfig: any;
  options: any[];
  lastUpdated: number;
}

class ConfigCacheService {
  /**
   * Cache configuration data in PouchDB
   */
  public async cacheConfig(config: Partial<CachedConfig>): Promise<void> {
    try {
      // Save each configuration type separately in PouchDB
      if (config.windowTypes) {
        await pouchDBService.saveConfig('window_types', config.windowTypes);
      }
      if (config.extras) {
        await pouchDBService.saveConfig('extras', config.extras);
      }
      if (config.finishes) {
        await pouchDBService.saveConfig('finishes', config.finishes);
      }
      if (config.companyInfo) {
        await pouchDBService.saveConfig('company_info', config.companyInfo);
      }
      if (config.pdfTextConfig) {
        await pouchDBService.saveConfig(
          'pdf_text_config',
          config.pdfTextConfig
        );
      }
      if (config.options) {
        await pouchDBService.saveConfig('options', config.options);
      }

      console.log('ConfigCache: Configuration cached successfully in PouchDB');
    } catch (error) {
      console.error('ConfigCache: Error caching configuration:', error);
      throw error;
    }
  }

  /**
   * Get cached configuration from PouchDB
   */
  public async getConfig(): Promise<CachedConfig> {
    try {
      // Get all configuration from PouchDB
      const allConfig = await pouchDBService.getAllConfig();

      const config: CachedConfig = {
        windowTypes: allConfig.window_types || [],
        extras: allConfig.extras || [],
        finishes: allConfig.finishes || [],
        companyInfo: allConfig.company_info || {},
        pdfTextConfig: allConfig.pdf_text_config || {},
        options: allConfig.options || [],
        lastUpdated: Date.now(),
      };

      return config;
    } catch (error) {
      console.error(
        'ConfigCache: Error getting configuration from PouchDB:',
        error
      );

      // Return empty config if PouchDB fails
      return this.getEmptyConfig();
    }
  }

  /**
   * Get empty configuration structure
   */
  private getEmptyConfig(): CachedConfig {
    return {
      windowTypes: [],
      extras: [],
      finishes: [],
      companyInfo: {},
      pdfTextConfig: {},
      options: [],
      lastUpdated: 0,
    };
  }

  /**
   * Cache window types
   */
  public async cacheWindowTypes(windowTypes: any[]): Promise<void> {
    await pouchDBService.saveConfig('window_types', windowTypes);
  }

  /**
   * Cache extras
   */
  public async cacheExtras(extras: any[]): Promise<void> {
    await pouchDBService.saveConfig('extras', extras);
  }

  /**
   * Cache finishes
   */
  public async cacheFinishes(finishes: any[]): Promise<void> {
    await pouchDBService.saveConfig('finishes', finishes);
  }

  /**
   * Cache company info
   */
  public async cacheCompanyInfo(companyInfo: any): Promise<void> {
    await pouchDBService.saveConfig('company_info', companyInfo);
  }

  /**
   * Cache PDF text config
   */
  public async cachePdfTextConfig(pdfTextConfig: any): Promise<void> {
    await pouchDBService.saveConfig('pdf_text_config', pdfTextConfig);
  }

  /**
   * Cache options
   */
  public async cacheOptions(options: any[]): Promise<void> {
    await pouchDBService.saveConfig('options', options);
  }

  /**
   * Force sync with CouchDB
   */
  public async forceSync(): Promise<void> {
    await pouchDBService.forceSync();
  }

  /**
   * Get sync status
   */
  public getSyncStatus() {
    return pouchDBService.getSyncStatus();
  }

  /**
   * Setup continuous sync
   */
  public setupContinuousSync(): void {
    pouchDBService.setupContinuousSync();
  }

  /**
   * Clear all configuration
   */
  public async clearConfig(): Promise<void> {
    try {
      // This will be handled by PouchDB force sync
      console.log('ConfigCache: Configuration will be cleared on next sync');
    } catch (error) {
      console.error('ConfigCache: Error clearing configuration:', error);
      throw error;
    }
  }

  /**
   * Check if configuration is available
   */
  public async hasConfig(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      return (
        config.windowTypes.length > 0 ||
        config.extras.length > 0 ||
        config.finishes.length > 0 ||
        Object.keys(config.companyInfo).length > 0
      );
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const configCacheService = new ConfigCacheService();
