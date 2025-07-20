/**
 * PouchDB Service for offline data storage and CouchDB synchronisation
 * Provides bidirectional sync with conflict resolution
 */

import PouchDB from 'pouchdb';

export interface SyncStatus {
    isOnline: boolean;
    lastSync: Date | null;
    syncInProgress: boolean;
    error: string | null;
    docsRead: number;
    docsWritten: number;
    docWriteFailures: number;
    errors: any[];
}

export interface WindowConfig {
    _id: string;
    _rev?: string;
    type: 'window_type' | 'extra' | 'finish';
    name: string;
    price: number;
    description?: string;
    category?: string;
    updatedAt: string;
}

export interface WindowEstimate {
    _id: string;
    _rev?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    windows: any[];
    totalPrice: number;
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'sent' | 'approved' | 'rejected';
}

class PouchDBService {
    private configDB: PouchDB.Database;
    private estimatesDB: PouchDB.Database;
    private configSync: PouchDB.Replication.Sync<{}> | null = null;
    private estimatesSync: PouchDB.Replication.Sync<{}> | null = null;
    private syncStatus: SyncStatus = {
        isOnline: navigator.onLine,
        lastSync: null,
        syncInProgress: false,
        error: null,
        docsRead: 0,
        docsWritten: 0,
        docWriteFailures: 0,
        errors: []
    };
    private statusCallbacks: ((status: SyncStatus) => void)[] = [];

    constructor() {
        // Initialize local databases
        this.configDB = new PouchDB('window_config');
        this.estimatesDB = new PouchDB('window_estimates');

        // Listen for online/offline events
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));

        // Start sync if online
        if (navigator.onLine) {
            this.startSync();
        }
    }

    /**
     * Subscribe to sync status updates
     */
    onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
        this.statusCallbacks.push(callback);
        // Return unsubscribe function
        return () => {
            const index = this.statusCallbacks.indexOf(callback);
            if (index > -1) {
                this.statusCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Get current sync status
     */
    getSyncStatus(): SyncStatus {
        return { ...this.syncStatus };
    }

    /**
     * Handle online event
     */
    private handleOnline(): void {
        this.syncStatus.isOnline = true;
        this.updateSyncStatus();
        this.startSync();
    }

    /**
     * Handle offline event
     */
    private handleOffline(): void {
        this.syncStatus.isOnline = false;
        this.updateSyncStatus();
        this.stopSync();
    }

    /**
     * Update sync status and notify callbacks
     */
    private updateSyncStatus(): void {
        this.statusCallbacks.forEach(callback => callback(this.syncStatus));
    }

    /**
     * Start bidirectional sync with CouchDB
     */
    async startSync(): Promise<void> {
        if (!navigator.onLine) return;

        const configUrl = import.meta.env.VITE_COUCHDB_CONFIG_URL || 
                         process.env.COUCHDB_CONFIG_URL;
        const estimatesUrl = import.meta.env.VITE_COUCHDB_ESTIMATES_URL || 
                            process.env.COUCHDB_ESTIMATES_URL;

        if (!configUrl || !estimatesUrl) {
            console.warn('CouchDB URLs not configured, sync disabled');
            return;
        }

        try {
            // Start config sync
            this.configSync = this.configDB.sync(configUrl, {
                live: true,
                retry: true,
                heartbeat: 10000,
                timeout: 30000
            });

            // Start estimates sync
            this.estimatesSync = this.estimatesDB.sync(estimatesUrl, {
                live: true,
                retry: true,
                heartbeat: 10000,
                timeout: 30000
            });

            this.setupSyncEventHandlers();
            
        } catch (error) {
            console.error('Failed to start sync:', error);
            this.syncStatus.error = error instanceof Error ? error.message : 'Sync failed';
            this.updateSyncStatus();
        }
    }

    /**
     * Stop sync
     */
    stopSync(): void {
        if (this.configSync) {
            this.configSync.cancel();
            this.configSync = null;
        }
        if (this.estimatesSync) {
            this.estimatesSync.cancel();
            this.estimatesSync = null;
        }
        this.syncStatus.syncInProgress = false;
        this.updateSyncStatus();
    }

    /**
     * Setup event handlers for sync
     */
    private setupSyncEventHandlers(): void {
        const handleSyncChange = (info: any) => {
            this.syncStatus.docsRead += info.change?.docs_read || 0;
            this.syncStatus.docsWritten += info.change?.docs_written || 0;
            this.syncStatus.lastSync = new Date();
            this.updateSyncStatus();
        };

        const handleSyncPaused = () => {
            this.syncStatus.syncInProgress = false;
            this.updateSyncStatus();
        };

        const handleSyncActive = () => {
            this.syncStatus.syncInProgress = true;
            this.syncStatus.error = null;
            this.updateSyncStatus();
        };

        const handleSyncError = (err: any) => {
            console.error('Sync error:', err);
            this.syncStatus.error = err.message || 'Sync error occurred';
            this.syncStatus.errors.push(err);
            this.syncStatus.syncInProgress = false;
            this.updateSyncStatus();
        };

        // Setup handlers for both syncs
        [this.configSync, this.estimatesSync].forEach(sync => {
            if (sync) {
                sync.on('change', handleSyncChange);
                sync.on('paused', handleSyncPaused);
                sync.on('active', handleSyncActive);
                sync.on('error', handleSyncError);
            }
        });
    }

    /**
     * Force sync - overwrite local data with remote data
     */
    async forceSync(): Promise<void> {
        if (!navigator.onLine) {
            throw new Error('Cannot force sync while offline');
        }

        const configUrl = import.meta.env.VITE_COUCHDB_CONFIG_URL || 
                         process.env.COUCHDB_CONFIG_URL;
        const estimatesUrl = import.meta.env.VITE_COUCHDB_ESTIMATES_URL || 
                            process.env.COUCHDB_ESTIMATES_URL;

        if (!configUrl || !estimatesUrl) {
            throw new Error('CouchDB URLs not configured');
        }

        try {
            this.syncStatus.syncInProgress = true;
            this.syncStatus.error = null;
            this.updateSyncStatus();

            // Stop current sync
            this.stopSync();

            // Clear local databases
            await this.configDB.destroy();
            await this.estimatesDB.destroy();

            // Recreate databases
            this.configDB = new PouchDB('window_config');
            this.estimatesDB = new PouchDB('window_estimates');

            // Pull from remote
            await this.configDB.replicate.from(configUrl);
            await this.estimatesDB.replicate.from(estimatesUrl);

            this.syncStatus.lastSync = new Date();
            this.syncStatus.syncInProgress = false;
            this.updateSyncStatus();

            // Restart live sync
            this.startSync();

        } catch (error) {
            console.error('Force sync failed:', error);
            this.syncStatus.error = error instanceof Error ? error.message : 'Force sync failed';
            this.syncStatus.syncInProgress = false;
            this.updateSyncStatus();
            throw error;
        }
    }

    /**
     * Get window configuration data
     */
    async getWindowConfig(): Promise<WindowConfig[]> {
        try {
            const result = await this.configDB.allDocs({ include_docs: true });
            return result.rows
                .filter(row => row.doc && !row.doc._id.startsWith('_design'))
                .map(row => row.doc as WindowConfig);
        } catch (error) {
            console.error('Failed to get window config:', error);
            return [];
        }
    }

    /**
     * Save window configuration
     */
    async saveWindowConfig(config: Omit<WindowConfig, '_id' | '_rev'>): Promise<WindowConfig> {
        const doc: WindowConfig = {
            ...config,
            _id: `${config.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            updatedAt: new Date().toISOString()
        };

        const result = await this.configDB.put(doc);
        return { ...doc, _rev: result.rev };
    }

    /**
     * Get estimates
     */
    async getEstimates(): Promise<WindowEstimate[]> {
        try {
            const result = await this.estimatesDB.allDocs({ include_docs: true });
            return result.rows
                .filter(row => row.doc && !row.doc._id.startsWith('_design'))
                .map(row => row.doc as WindowEstimate)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error('Failed to get estimates:', error);
            return [];
        }
    }

    /**
     * Save estimate
     */
    async saveEstimate(estimate: Omit<WindowEstimate, '_id' | '_rev'>): Promise<WindowEstimate> {
        const doc: WindowEstimate = {
            ...estimate,
            _id: `estimate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            updatedAt: new Date().toISOString()
        };

        const result = await this.estimatesDB.put(doc);
        return { ...doc, _rev: result.rev };
    }

    /**
     * Get estimate by ID
     */
    async getEstimate(id: string): Promise<WindowEstimate | null> {
        try {
            const doc = await this.estimatesDB.get(id);
            return doc as WindowEstimate;
        } catch (error) {
            if ((error as any).status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Update estimate
     */
    async updateEstimate(estimate: WindowEstimate): Promise<WindowEstimate> {
        const updatedDoc = {
            ...estimate,
            updatedAt: new Date().toISOString()
        };

        const result = await this.estimatesDB.put(updatedDoc);
        return { ...updatedDoc, _rev: result.rev };
    }

    /**
     * Delete estimate
     */
    async deleteEstimate(id: string): Promise<void> {
        const doc = await this.estimatesDB.get(id);
        await this.estimatesDB.remove(doc);
    }
}

// Export singleton instance
export const pouchDBService = new PouchDBService();
export default pouchDBService;
