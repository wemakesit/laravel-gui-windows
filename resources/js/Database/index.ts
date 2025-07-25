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
    return databaseInstance;
  }

  databaseInstance = new Database({
    adapter,
    modelClasses: [Customer, Estimate, Window, Extra, Photo, WindowType, Finish, CompanyInfo],
  });

  return databaseInstance;
}

// Create the database with persistence debugging
export const database = createDatabase();

// Production-ready database instance
// Debug logging removed for production use

export default database;

// Export types for convenience
export type { Customer, Estimate, Window, Extra, Photo, WindowType, Finish, CompanyInfo };
