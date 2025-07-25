/**
 * Frontend Configuration Service
 * Provides access to configuration values injected from the backend
 */

interface FrontendConfig {
  api: {
    base_url: string;
    timeout: number;
    retry_attempts: number;
  };
  watermelon: {
    sync_url: string;
    auto_sync_interval: number;
    batch_size: number;
  };
  pwa: {
    cache_version: string;
    offline_timeout: number;
    sync_interval: number;
  };
  camera: {
    max_width: number;
    max_height: number;
    quality: number;
    format: string;
  };
  ui: {
    wizard_timeout: number;
    persistence_delay: number;
    debounce_delay: number;
  };
  debug: {
    enabled: boolean;
    log_level: string;
    show_pwa_debug: boolean;
  };
  external_apis: {
    postcodes_io_url: string;
    address_lookup_timeout: number;
  };
  app: {
    name: string;
    env: string;
    debug: boolean;
    url: string;
  };
}

class ConfigService {
  private config: FrontendConfig | null = null;

  /**
   * Initialize configuration from window object
   */
  private loadConfig(): FrontendConfig {
    if (this.config) {
      return this.config;
    }

    // Try to get config from window object (injected by backend)
    const windowConfig = (window as any).frontendConfig;
    if (windowConfig) {
      this.config = windowConfig;
      return this.config;
    }

    // Fallback to default configuration
    console.warn('Frontend config not found, using defaults');
    this.config = this.getDefaultConfig();
    return this.config;
  }

  /**
   * Get default configuration (fallback)
   */
  private getDefaultConfig(): FrontendConfig {
    return {
      api: {
        base_url: '/api-proxy',
        timeout: 30000,
        retry_attempts: 3,
      },
      watermelon: {
        sync_url: '/api/watermelon/sync',
        auto_sync_interval: 300000,
        batch_size: 100,
      },
      pwa: {
        cache_version: '1.0.0',
        offline_timeout: 5000,
        sync_interval: 600000,
      },
      camera: {
        max_width: 1920,
        max_height: 1080,
        quality: 0.8,
        format: 'image/jpeg',
      },
      ui: {
        wizard_timeout: 3000,
        persistence_delay: 1000,
        debounce_delay: 300,
      },
      debug: {
        enabled: false,
        log_level: 'error',
        show_pwa_debug: false,
      },
      external_apis: {
        postcodes_io_url: 'https://api.postcodes.io',
        address_lookup_timeout: 5000,
      },
      app: {
        name: 'Laravel GUI Windows',
        env: 'production',
        debug: false,
        url: window.location.origin,
      },
    };
  }

  /**
   * Get full configuration
   */
  get(): FrontendConfig {
    return this.loadConfig();
  }

  /**
   * Get specific configuration section
   */
  getSection<K extends keyof FrontendConfig>(section: K): FrontendConfig[K] {
    return this.loadConfig()[section];
  }

  /**
   * Get specific configuration value
   */
  getValue<K extends keyof FrontendConfig, V extends keyof FrontendConfig[K]>(
    section: K,
    key: V
  ): FrontendConfig[K][V] {
    return this.loadConfig()[section][key];
  }

  /**
   * Check if we're in development mode
   */
  isDevelopment(): boolean {
    return this.getValue('app', 'env') === 'local' || this.getValue('app', 'debug');
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.getValue('debug', 'enabled');
  }

  /**
   * Get API base URL
   */
  getApiBaseUrl(): string {
    return this.getValue('api', 'base_url');
  }

  /**
   * Get Watermelon sync URL
   */
  getWatermelonSyncUrl(): string {
    return this.getValue('watermelon', 'sync_url');
  }
}

// Export singleton instance
export const configService = new ConfigService();
export type { FrontendConfig };
