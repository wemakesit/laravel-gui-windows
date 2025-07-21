/**
 * IndexedDB Service for offline data storage
 * Provides robust local storage for estimates, configuration, and media files
 */

export interface EstimateRecord {
  id: string;
  customerInfo: any;
  windows: any[];
  selectedCaveats: any;
  companyInfo: any;
  timestamp: number;
  synced: boolean;
  lastModified: number;
  status: 'draft' | 'completed' | 'synced';
}

export interface ConfigRecord {
  key: string;
  data: any;
  timestamp: number;
  version: number;
}

export interface PhotoRecord {
  id: string;
  estimateId: string;
  windowIndex: number;
  blob: Blob;
  filename: string;
  timestamp: number;
  synced: boolean;
  metadata: {
    size: number;
    type: string;
    width?: number;
    height?: number;
  };
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'WindowEstimateDB';
  private readonly dbVersion = 1;

  constructor() {
    this.init();
  }

  /**
   * Initialize IndexedDB
   */
  private async init(): Promise<void> {
    try {
      this.db = await this.openDatabase();
      console.log('IndexedDB: Database initialized successfully');
    } catch (error) {
      console.error('IndexedDB: Failed to initialize database:', error);
    }
  }

  /**
   * Open IndexedDB database
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  /**
   * Create object stores
   */
  private createObjectStores(db: IDBDatabase): void {
    // Estimates store
    if (!db.objectStoreNames.contains('estimates')) {
      const estimatesStore = db.createObjectStore('estimates', {
        keyPath: 'id',
      });
      estimatesStore.createIndex('timestamp', 'timestamp', { unique: false });
      estimatesStore.createIndex('synced', 'synced', { unique: false });
      estimatesStore.createIndex('status', 'status', { unique: false });
    }

    // Configuration store
    if (!db.objectStoreNames.contains('config')) {
      const configStore = db.createObjectStore('config', { keyPath: 'key' });
      configStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    // Photos store
    if (!db.objectStoreNames.contains('photos')) {
      const photosStore = db.createObjectStore('photos', { keyPath: 'id' });
      photosStore.createIndex('estimateId', 'estimateId', { unique: false });
      photosStore.createIndex('synced', 'synced', { unique: false });
      photosStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    console.log('IndexedDB: Object stores created');
  }

  /**
   * Ensure database is ready
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = await this.openDatabase();
    }
    return this.db;
  }

  /**
   * Save estimate to IndexedDB
   */
  public async saveEstimate(estimate: EstimateRecord): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['estimates'], 'readwrite');
      const store = transaction.objectStore('estimates');

      estimate.lastModified = Date.now();
      const request = store.put(estimate);

      request.onsuccess = () => {
        console.log('IndexedDB: Estimate saved:', estimate.id);
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB: Failed to save estimate:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get estimate by ID
   */
  public async getEstimate(id: string): Promise<EstimateRecord | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['estimates'], 'readonly');
      const store = transaction.objectStore('estimates');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all estimates
   */
  public async getAllEstimates(): Promise<EstimateRecord[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['estimates'], 'readonly');
      const store = transaction.objectStore('estimates');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get unsynced estimates
   */
  public async getUnsyncedEstimates(): Promise<EstimateRecord[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['estimates'], 'readonly');
      const store = transaction.objectStore('estimates');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Delete estimate
   */
  public async deleteEstimate(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['estimates'], 'readwrite');
      const store = transaction.objectStore('estimates');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('IndexedDB: Estimate deleted:', id);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Save configuration data
   */
  public async saveConfig(key: string, data: any): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['config'], 'readwrite');
      const store = transaction.objectStore('config');

      const configRecord: ConfigRecord = {
        key,
        data,
        timestamp: Date.now(),
        version: 1,
      };

      const request = store.put(configRecord);

      request.onsuccess = () => {
        console.log('IndexedDB: Config saved:', key);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get configuration data
   */
  public async getConfig(key: string): Promise<any | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['config'], 'readonly');
      const store = transaction.objectStore('config');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Delete configuration data
   */
  public async deleteConfig(key: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['config'], 'readwrite');
      const store = transaction.objectStore('config');
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log('IndexedDB: Config deleted:', key);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Save photo
   */
  public async savePhoto(photo: PhotoRecord): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['photos'], 'readwrite');
      const store = transaction.objectStore('photos');
      const request = store.put(photo);

      request.onsuccess = () => {
        console.log('IndexedDB: Photo saved:', photo.id);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get photos for estimate
   */
  public async getPhotosForEstimate(
    estimateId: string
  ): Promise<PhotoRecord[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const index = store.index('estimateId');
      const request = index.getAll(estimateId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all data (for testing/reset)
   */
  public async clearAllData(): Promise<void> {
    const db = await this.ensureDB();

    const stores = ['estimates', 'config', 'photos'];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(stores, 'readwrite');

      let completed = 0;
      const total = stores.length;

      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            console.log('IndexedDB: All data cleared');
            resolve();
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
