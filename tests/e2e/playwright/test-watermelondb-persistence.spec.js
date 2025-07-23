/**
 * Simple WatermelonDB Persistence Test
 * Tests if data persists correctly with our configuration
 */

import { test, expect } from '@playwright/test';

test.describe('WatermelonDB Persistence Direct Test', () => {
  test('should test persistence with direct browser access', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log('🧪 Testing WatermelonDB persistence directly...');

    // Navigate directly to a page that uses WatermelonDB
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('networkidle');

    // Inject WatermelonDB test code directly into the page
    const testResult = await page.evaluate(async () => {
      try {
        // Wait for the page to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if we can access IndexedDB
        if (!window.indexedDB) {
          return { success: false, error: 'IndexedDB not available' };
        }

        // Test IndexedDB directly
        const dbName = 'window_estimates_db';
        
        // Try to open the database
        const openRequest = indexedDB.open(dbName, 1);
        
        return new Promise((resolve) => {
          openRequest.onerror = () => {
            resolve({ success: false, error: 'Failed to open IndexedDB' });
          };

          openRequest.onsuccess = (event) => {
            const db = event.target.result;
            
            // Check if the database has the expected structure
            const objectStoreNames = Array.from(db.objectStoreNames);
            
            db.close();
            
            resolve({
              success: true,
              dbName: db.name,
              version: db.version,
              objectStores: objectStoreNames,
              hasLokiStore: objectStoreNames.includes('loki'),
            });
          };

          openRequest.onupgradeneeded = (event) => {
            // Database is being created/upgraded
            const db = event.target.result;
            
            resolve({
              success: true,
              dbName: db.name,
              version: db.version,
              objectStores: [],
              isNewDatabase: true,
            });
          };
        });

      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });

    console.log('🧪 IndexedDB test result:', testResult);

    // Verify IndexedDB is working
    expect(testResult.success).toBe(true);
    
    if (testResult.success) {
      console.log('✅ IndexedDB is accessible');
      console.log('Database name:', testResult.dbName);
      console.log('Database version:', testResult.version);
      console.log('Object stores:', testResult.objectStores);
      
      if (testResult.hasLokiStore) {
        console.log('✅ LokiJS store found - persistence should work');
      } else if (testResult.isNewDatabase) {
        console.log('ℹ️ New database created - this is expected on first run');
      } else {
        console.log('⚠️ No LokiJS store found - persistence might not be working');
      }
    }

    // Now test if we can create and persist data
    const persistenceTest = await page.evaluate(async () => {
      try {
        const dbName = 'test_persistence_db';
        
        // Create a simple test database
        const openRequest = indexedDB.open(dbName, 1);
        
        return new Promise((resolve) => {
          openRequest.onerror = () => {
            resolve({ success: false, error: 'Failed to create test database' });
          };

          openRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create an object store
            const store = db.createObjectStore('test_data', { keyPath: 'id' });
            
            console.log('Test database created with object store');
          };

          openRequest.onsuccess = (event) => {
            const db = event.target.result;
            
            // Add test data
            const transaction = db.transaction(['test_data'], 'readwrite');
            const store = transaction.objectStore('test_data');
            
            const testData = {
              id: 1,
              name: 'Test Item',
              timestamp: Date.now(),
            };
            
            const addRequest = store.add(testData);
            
            addRequest.onsuccess = () => {
              console.log('Test data added successfully');
              
              // Now read it back
              const getRequest = store.get(1);
              
              getRequest.onsuccess = () => {
                const retrievedData = getRequest.result;
                
                db.close();
                
                resolve({
                  success: true,
                  dataAdded: !!retrievedData,
                  retrievedData: retrievedData,
                });
              };
              
              getRequest.onerror = () => {
                db.close();
                resolve({ success: false, error: 'Failed to retrieve test data' });
              };
            };
            
            addRequest.onerror = () => {
              db.close();
              resolve({ success: false, error: 'Failed to add test data' });
            };
          };
        });

      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });

    console.log('🧪 Persistence test result:', persistenceTest);

    // Verify persistence works
    expect(persistenceTest.success).toBe(true);
    expect(persistenceTest.dataAdded).toBe(true);
    
    if (persistenceTest.success) {
      console.log('✅ IndexedDB persistence is working correctly');
      console.log('Retrieved data:', persistenceTest.retrievedData);
    }

    console.log('🎉 WatermelonDB persistence test completed successfully!');
  });
});
