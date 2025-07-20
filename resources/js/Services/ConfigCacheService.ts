/**
 * Configuration Cache Service
 * Handles caching of window types, extras, finishes, and company configuration
 */

import { indexedDBService } from './IndexedDBService';

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
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CONFIG_KEY = 'app_configuration';

  /**
   * Cache configuration data
   */
  public async cacheConfig(config: Partial<CachedConfig>): Promise<void> {
    try {
      const existingConfig = await this.getConfig();
      const updatedConfig: CachedConfig = {
        ...existingConfig,
        ...config,
        lastUpdated: Date.now()
      };

      await indexedDBService.saveConfig(this.CONFIG_KEY, updatedConfig);
      
      // Also save to localStorage as fallback
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(updatedConfig));
      
      console.log('ConfigCache: Configuration cached successfully');
    } catch (error) {
      console.error('ConfigCache: Error caching configuration:', error);
      
      // Fallback to localStorage only
      try {
        const existingConfig = this.getConfigFromLocalStorage();
        const updatedConfig: CachedConfig = {
          ...existingConfig,
          ...config,
          lastUpdated: Date.now()
        };
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(updatedConfig));
      } catch (fallbackError) {
        console.error('ConfigCache: Fallback caching failed:', fallbackError);
      }
    }
  }

  /**
   * Get cached configuration
   */
  public async getConfig(): Promise<CachedConfig> {
    try {
      // Try IndexedDB first
      const config = await indexedDBService.getConfig(this.CONFIG_KEY);
      if (config && this.isConfigValid(config)) {
        return config;
      }
      
      // Fallback to localStorage
      const localConfig = this.getConfigFromLocalStorage();
      if (this.isConfigValid(localConfig)) {
        return localConfig;
      }
      
      // Return empty config if nothing found
      return this.getEmptyConfig();
    } catch (error) {
      console.error('ConfigCache: Error getting configuration:', error);
      
      // Final fallback to localStorage
      try {
        const localConfig = this.getConfigFromLocalStorage();
        if (this.isConfigValid(localConfig)) {
          return localConfig;
        }
      } catch (fallbackError) {
        console.error('ConfigCache: Fallback get failed:', fallbackError);
      }
      
      return this.getEmptyConfig();
    }
  }

  /**
   * Get configuration from localStorage
   */
  private getConfigFromLocalStorage(): CachedConfig {
    try {
      const cached = localStorage.getItem(this.CONFIG_KEY);
      return cached ? JSON.parse(cached) : this.getEmptyConfig();
    } catch (error) {
      console.error('ConfigCache: Error parsing localStorage config:', error);
      return this.getEmptyConfig();
    }
  }

  /**
   * Check if cached config is still valid
   */
  private isConfigValid(config: CachedConfig): boolean {
    if (!config || !config.lastUpdated) {
      return false;
    }
    
    const age = Date.now() - config.lastUpdated;
    return age < this.CACHE_DURATION;
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
      lastUpdated: 0
    };
  }

  /**
   * Cache window types
   */
  public async cacheWindowTypes(windowTypes: any[]): Promise<void> {
    await this.cacheConfig({ windowTypes });
  }

  /**
   * Cache extras
   */
  public async cacheExtras(extras: any[]): Promise<void> {
    await this.cacheConfig({ extras });
  }

  /**
   * Cache finishes
   */
  public async cacheFinishes(finishes: any[]): Promise<void> {
    await this.cacheConfig({ finishes });
  }

  /**
   * Cache company info
   */
  public async cacheCompanyInfo(companyInfo: any): Promise<void> {
    await this.cacheConfig({ companyInfo });
  }

  /**
   * Cache PDF text config
   */
  public async cachePdfTextConfig(pdfTextConfig: any): Promise<void> {
    await this.cacheConfig({ pdfTextConfig });
  }

  /**
   * Cache options
   */
  public async cacheOptions(options: any[]): Promise<void> {
    await this.cacheConfig({ options });
  }

  /**
   * Get cached window types
   */
  public async getWindowTypes(): Promise<any[]> {
    const config = await this.getConfig();
    return config.windowTypes || [];
  }

  /**
   * Get cached extras
   */
  public async getExtras(): Promise<any[]> {
    const config = await this.getConfig();
    return config.extras || [];
  }

  /**
   * Get cached finishes
   */
  public async getFinishes(): Promise<any[]> {
    const config = await this.getConfig();
    return config.finishes || [];
  }

  /**
   * Get cached company info
   */
  public async getCompanyInfo(): Promise<any> {
    const config = await this.getConfig();
    return config.companyInfo || {};
  }

  /**
   * Get cached PDF text config
   */
  public async getPdfTextConfig(): Promise<any> {
    const config = await this.getConfig();
    return config.pdfTextConfig || {};
  }

  /**
   * Get cached options
   */
  public async getOptions(): Promise<any[]> {
    const config = await this.getConfig();
    return config.options || [];
  }

  /**
   * Check if configuration is cached and valid
   */
  public async isConfigCached(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      return this.isConfigValid(config) && config.windowTypes.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear cached configuration
   */
  public async clearConfig(): Promise<void> {
    try {
      await indexedDBService.saveConfig(this.CONFIG_KEY, this.getEmptyConfig());
      localStorage.removeItem(this.CONFIG_KEY);
      console.log('ConfigCache: Configuration cleared');
    } catch (error) {
      console.error('ConfigCache: Error clearing configuration:', error);
      localStorage.removeItem(this.CONFIG_KEY);
    }
  }

  /**
   * Force refresh configuration (mark as expired)
   */
  public async forceRefresh(): Promise<void> {
    try {
      const config = await this.getConfig();
      config.lastUpdated = 0; // Mark as expired
      await indexedDBService.saveConfig(this.CONFIG_KEY, config);
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
      console.log('ConfigCache: Configuration marked for refresh');
    } catch (error) {
      console.error('ConfigCache: Error forcing refresh:', error);
    }
  }
}

// Export singleton instance
export const configCacheService = new ConfigCacheService();
