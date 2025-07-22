import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import schema from './schema';
import migrations from './migrations';
import { Customer, Estimate, Window, Extra, Photo } from './models';

// Create the adapter for web (using LokiJS with IndexedDB)
const adapter = new LokiJSAdapter({
  schema,
  migrations,
  useWebWorker: false, // Disable for now to avoid complexity
  useIncrementalIndexedDB: true, // Use IndexedDB for persistence
  dbName: 'window_estimates_db',

  // Event handlers
  onQuotaExceededError: error => {
    console.error('Database quota exceeded:', error);
    // TODO: Show user notification about storage space
  },

  onSetUpError: error => {
    console.error('Database setup failed:', error);
    // TODO: Show user notification and offer to reload
  },

  extraIncrementalIDBOptions: {
    onDidOverwrite: () => {
      console.warn('Database was overwritten by another tab');
      // TODO: Sync data and notify user
    },

    onversionchange: () => {
      console.warn('Database was deleted in another tab');
      // TODO: Check if user is still logged in and reload if needed
      window.location.reload();
    },
  },
});

// Create the database
export const database = new Database({
  adapter,
  modelClasses: [Customer, Estimate, Window, Extra, Photo],
});

export default database;

// Export types for convenience
export type { Customer, Estimate, Window, Extra, Photo };
