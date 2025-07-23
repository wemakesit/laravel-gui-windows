import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import schema from './schema';
import migrations from './migrations';
import { Customer, Estimate, Window, Extra, Photo, WindowType, Finish, CompanyInfo } from './models';

// Create the adapter for web (using LokiJS with IndexedDB)
// Using the exact configuration from WatermelonDB documentation
const adapter = new LokiJSAdapter({
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  dbName: 'window_estimates_db',

  // Add proper error handling and persistence options
  onQuotaExceededError: (error) => {
    console.error('Database quota exceeded:', error);
  },

  onSetUpError: (error) => {
    console.error('Database setup failed:', error);
  },

  extraIncrementalIDBOptions: {
    onDidOverwrite: () => {
      console.warn('Database was overwritten by another tab');
    },

    onversionchange: () => {
      console.warn('Database was deleted in another tab');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    },
  },
});

// Create a singleton database instance to ensure persistence across page navigations
let databaseInstance: Database | null = null;

function createDatabase(): Database {
  if (databaseInstance) {
    console.log('🍉 Reusing existing database instance');
    return databaseInstance;
  }

  console.log('🍉 Creating new database instance');
  databaseInstance = new Database({
    adapter,
    modelClasses: [Customer, Estimate, Window, Extra, Photo, WindowType, Finish, CompanyInfo],
  });

  return databaseInstance;
}

// Create the database with persistence debugging
export const database = createDatabase();

// Add database lifecycle debugging
if (typeof window !== 'undefined') {
  // Debug database operations
  const originalWrite = database.write.bind(database);
  database.write = async (action) => {
    console.log('🍉 Database write operation starting...');
    const result = await originalWrite(action);
    console.log('🍉 Database write operation completed, data should be persisted');
    return result;
  };

  // Track database ready state (with safety checks)
  try {
    const adapter = database.adapter as any;
    if (adapter.underlyingAdapter && adapter.underlyingAdapter.loki) {
      adapter.underlyingAdapter.loki.on('ready', () => {
        console.log('🍉 LokiJS database is ready and should persist to IndexedDB');
      });

      // Track save operations
      adapter.underlyingAdapter.loki.on('save', () => {
        console.log('🍉 LokiJS database saved to IndexedDB');
      });

      // Track load operations
      adapter.underlyingAdapter.loki.on('load', () => {
        console.log('🍉 LokiJS database loaded from IndexedDB');
      });
    }
  } catch (error: any) {
    console.log('🍉 Could not attach database event listeners:', error.message);
  }
}

export default database;

// Export types for convenience
export type { Customer, Estimate, Window, Extra, Photo, WindowType, Finish, CompanyInfo };
