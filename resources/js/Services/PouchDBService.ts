/**
 * PouchDB Service
 * Handles PouchDB operations and CouchDB synchronisation for configuration data
 */

// @ts-ignore
import PouchDB from 'pouchdb';

export interface ConfigDocument {
  _id: string;
  _rev?: string;
  type:
    | 'window_types'
    | 'extras'
    | 'finishes'
    | 'company_info'
    | 'pdf_text_config'
    | 'options';
  data: any;
  lastUpdated: number;
  version: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  syncInProgress: boolean;
  error: string | null;
  documentsCount: number;
}

class PouchDBService {
  private configDB: any;
  private estimatesDB: any;
  private remoteConfigURL: string;
  private remoteEstimatesURL: string;
  private syncStatus: SyncStatus;
  private syncHandlers: any[] = [];

  constructor() {
    this.remoteConfigURL =
      process.env.COUCHDB_CONFIG_URL || 'http://localhost:5984/window_config';
    this.remoteEstimatesURL =
      process.env.COUCHDB_ESTIMATES_URL ||
      'http://localhost:5984/window_estimates';

    this.syncStatus = {
      isOnline: navigator.onLine,
      lastSync: null,
      syncInProgress: false,
      error: null,
      documentsCount: 0,
    };

    this.initializeDatabases();
    this.setupOnlineDetection();
  }

  /**
   * Initialize PouchDB databases
   */
  private async initializeDatabases(): Promise<void> {
    try {
      // Initialize configuration database
      this.configDB = new PouchDB('window_config', {
        auto_compaction: true,
        revs_limit: 10,
      });

      // Initialize estimates database
      this.estimatesDB = new PouchDB('window_estimates', {
        auto_compaction: true,
        revs_limit: 10,
      });

      console.log('PouchDB: Databases initialized successfully');
      await this.updateDocumentCount();
    } catch (error) {
      console.error('PouchDB: Failed to initialize databases:', error);
      throw error;
    }
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineDetection(): void {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      console.log('PouchDB: Back online');
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      console.log('PouchDB: Gone offline');
    });
  }

  /**
   * Update document count
   */
  private async updateDocumentCount(): Promise<void> {
    try {
      const info = await this.configDB.info();
      this.syncStatus.documentsCount = info.doc_count;
    } catch (error) {
      console.error('PouchDB: Error updating document count:', error);
    }
  }

  /**
   * Save configuration document
   */
  public async saveConfig(
    type: ConfigDocument['type'],
    data: any
  ): Promise<void> {
    try {
      const doc: ConfigDocument = {
        _id: `config_${type}`,
        type,
        data,
        lastUpdated: Date.now(),
        version: 1,
      };

      // Try to get existing document to preserve _rev
      try {
        const existing = await this.configDB.get(doc._id);
        doc._rev = existing._rev;
        doc.version = (existing.version || 0) + 1;
      } catch (error) {
        // Document doesn't exist, that's fine
      }

      await this.configDB.put(doc);
      await this.updateDocumentCount();

      console.log(`PouchDB: Saved ${type} configuration`);
    } catch (error) {
      console.error(`PouchDB: Error saving ${type} configuration:`, error);
      throw error;
    }
  }

  /**
   * Get configuration document
   */
  public async getConfig(type: ConfigDocument['type']): Promise<any | null> {
    try {
      const doc = await this.configDB.get(`config_${type}`);
      return doc.data;
    } catch (error) {
      if (error.status === 404) {
        return null; // Document not found
      }
      console.error(`PouchDB: Error getting ${type} configuration:`, error);
      throw error;
    }
  }

  /**
   * Get all configuration documents
   */
  public async getAllConfig(): Promise<Record<string, any>> {
    try {
      const result = await this.configDB.allDocs({
        include_docs: true,
        startkey: 'config_',
        endkey: 'config_\ufff0',
      });

      const config: Record<string, any> = {};
      result.rows.forEach((row: any) => {
        if (row.doc && row.doc.type) {
          config[row.doc.type] = row.doc.data;
        }
      });

      return config;
    } catch (error) {
      console.error('PouchDB: Error getting all configuration:', error);
      throw error;
    }
  }

  /**
   * Force sync with CouchDB (overwrite local with remote)
   */
  public async forceSync(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    if (this.syncStatus.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncStatus.syncInProgress = true;
    this.syncStatus.error = null;

    try {
      console.log('PouchDB: Starting force sync...');

      // Destroy local database and recreate to ensure clean sync
      await this.configDB.destroy();
      this.configDB = new PouchDB('window_config', {
        auto_compaction: true,
        revs_limit: 10,
      });

      // Replicate from remote (one-way sync from CouchDB to PouchDB)
      const replication = this.configDB.replicate.from(this.remoteConfigURL, {
        live: false,
        retry: false,
      });

      await new Promise((resolve, reject) => {
        replication.on('complete', (info: any) => {
          console.log('PouchDB: Force sync completed', info);
          resolve(info);
        });

        replication.on('error', (error: any) => {
          console.error('PouchDB: Force sync failed', error);
          reject(error);
        });
      });

      this.syncStatus.lastSync = new Date();
      await this.updateDocumentCount();

      // Notify sync handlers
      this.notifySyncHandlers();
    } catch (error) {
      console.error('PouchDB: Force sync error:', error);
      this.syncStatus.error = error.message;
      throw error;
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  /**
   * Setup continuous sync (bidirectional)
   */
  public setupContinuousSync(): void {
    if (!this.syncStatus.isOnline) {
      console.log('PouchDB: Cannot setup continuous sync while offline');
      return;
    }

    try {
      // Setup bidirectional sync for configuration
      const configSync = this.configDB.sync(this.remoteConfigURL, {
        live: true,
        retry: true,
        back_off_function: (delay: number) => {
          return Math.min(delay * 2, 60000); // Max 1 minute delay
        },
      });

      configSync.on('change', (info: any) => {
        console.log('PouchDB: Config sync change', info);
        this.syncStatus.lastSync = new Date();
        this.updateDocumentCount();
        this.notifySyncHandlers();
      });

      configSync.on('error', (error: any) => {
        console.error('PouchDB: Config sync error', error);
        this.syncStatus.error = error.message;
      });

      // Setup bidirectional sync for estimates
      const estimatesSync = this.estimatesDB.sync(this.remoteEstimatesURL, {
        live: true,
        retry: true,
        back_off_function: (delay: number) => {
          return Math.min(delay * 2, 60000);
        },
      });

      estimatesSync.on('change', (info: any) => {
        console.log('PouchDB: Estimates sync change', info);
        this.syncStatus.lastSync = new Date();
      });

      estimatesSync.on('error', (error: any) => {
        console.error('PouchDB: Estimates sync error', error);
      });

      console.log('PouchDB: Continuous sync setup completed');
    } catch (error) {
      console.error('PouchDB: Error setting up continuous sync:', error);
      this.syncStatus.error = error.message;
    }
  }

  /**
   * Get sync status
   */
  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Add sync status change handler
   */
  public onSyncChange(handler: (status: SyncStatus) => void): void {
    this.syncHandlers.push(handler);
  }

  /**
   * Remove sync status change handler
   */
  public removeSyncHandler(handler: (status: SyncStatus) => void): void {
    const index = this.syncHandlers.indexOf(handler);
    if (index > -1) {
      this.syncHandlers.splice(index, 1);
    }
  }

  /**
   * Notify all sync handlers
   */
  private notifySyncHandlers(): void {
    const status = this.getSyncStatus();
    this.syncHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('PouchDB: Error in sync handler:', error);
      }
    });
  }

  /**
   * Save estimate to PouchDB
   */
  public async saveEstimate(estimate: any): Promise<void> {
    try {
      const doc = {
        _id: `estimate_${estimate.id}`,
        type: 'estimate',
        data: estimate,
        lastUpdated: Date.now(),
      };

      await this.estimatesDB.put(doc);
      console.log('PouchDB: Estimate saved:', estimate.id);
    } catch (error) {
      console.error('PouchDB: Error saving estimate:', error);
      throw error;
    }
  }

  /**
   * Get all estimates from PouchDB
   */
  public async getAllEstimates(): Promise<any[]> {
    try {
      const result = await this.estimatesDB.allDocs({
        include_docs: true,
        startkey: 'estimate_',
        endkey: 'estimate_\ufff0',
      });

      return result.rows.map((row: any) => row.doc.data);
    } catch (error) {
      console.error('PouchDB: Error getting estimates:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const pouchDBService = new PouchDBService();
