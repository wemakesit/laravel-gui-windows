/**
 * Simple WatermelonDB Persistence Test
 * Tests persistence without complex setup
 */

import { test, expect } from '@playwright/test';

test.describe('Simple Persistence Test', () => {
  test('should test WatermelonDB persistence manually', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log('🧪 Starting simple persistence test...');

    // Step 1: Login manually
    await page.goto('http://localhost:8888/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for WatermelonDB to initialize

    console.log('🧪 Logged in successfully, testing persistence...');

    // Step 2: Create test data
    const testDataResult = await page.evaluate(async () => {
      try {
        console.log('🧪 Creating test data in WatermelonDB...');
        
        // Wait for service to be available
        let attempts = 0;
        while (!window.watermelonDBService && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.watermelonDBService) {
          throw new Error('WatermelonDB service not available');
        }

        // Create test window type
        await window.watermelonDBService.syncWindowTypesFromAPI([
          { id: 888, name: 'Persistence Test Window Type', type: 'test', cost: 888, is_active: true }
        ]);

        // Create test customer
        const customer = await window.watermelonDBService.createCustomer({
          name: 'Persistence Test Customer',
          email: 'persistence@test.com',
          phone: '01234567890',
          address: '123 Persistence Test Street',
        });

        // Verify data was created
        const windowTypes = await window.watermelonDBService.getCachedWindowTypes();
        const customers = await window.watermelonDBService.getAllCustomers();

        console.log('🧪 Test data created successfully');
        console.log('🧪 Window types:', windowTypes.length);
        console.log('🧪 Customers:', customers.length);

        return {
          success: true,
          windowTypesCount: windowTypes.length,
          customersCount: customers.length,
          testWindowType: windowTypes.find(wt => wt.name === 'Persistence Test Window Type'),
          testCustomer: customers.find(c => c.name === 'Persistence Test Customer'),
        };
      } catch (error) {
        console.error('🧪 Failed to create test data:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    });

    console.log('🧪 Test data creation result:', testDataResult);
    expect(testDataResult.success).toBe(true);
    expect(testDataResult.windowTypesCount).toBeGreaterThan(0);
    expect(testDataResult.customersCount).toBeGreaterThan(0);
    expect(testDataResult.testWindowType).toBeDefined();
    expect(testDataResult.testCustomer).toBeDefined();

    // Step 3: Wait for persistence (autosave should happen)
    console.log('🧪 Waiting for data to be persisted...');
    await page.waitForTimeout(3000); // Wait for autosave

    // Step 4: Reload page to test persistence
    console.log('🧪 Reloading page to test persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for database to load from IndexedDB

    // Step 5: Check if data persisted
    const persistenceResult = await page.evaluate(async () => {
      try {
        console.log('🧪 Checking if data persisted after reload...');
        
        // Wait for service to be available
        let attempts = 0;
        while (!window.watermelonDBService && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.watermelonDBService) {
          throw new Error('WatermelonDB service not available after reload');
        }

        // Check if our test data is still there
        const windowTypes = await window.watermelonDBService.getCachedWindowTypes();
        const customers = await window.watermelonDBService.getAllCustomers();

        const testWindowType = windowTypes.find(wt => wt.name === 'Persistence Test Window Type');
        const testCustomer = customers.find(c => c.name === 'Persistence Test Customer');

        console.log('🧪 Persistence check completed');
        console.log('🧪 Window types after reload:', windowTypes.length);
        console.log('🧪 Customers after reload:', customers.length);
        console.log('🧪 Test window type found:', !!testWindowType);
        console.log('🧪 Test customer found:', !!testCustomer);

        return {
          success: true,
          windowTypesCount: windowTypes.length,
          customersCount: customers.length,
          testWindowTypePersisted: !!testWindowType,
          testCustomerPersisted: !!testCustomer,
          allWindowTypes: windowTypes.map(wt => wt.name),
          allCustomers: customers.map(c => c.name),
        };
      } catch (error) {
        console.error('🧪 Failed to check persistence:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    });

    console.log('🧪 Persistence check result:', persistenceResult);

    // Verify persistence worked
    expect(persistenceResult.success).toBe(true);
    
    if (persistenceResult.testWindowTypePersisted && persistenceResult.testCustomerPersisted) {
      console.log('🎉 SUCCESS: Data persisted correctly across page reload!');
      expect(persistenceResult.testWindowTypePersisted).toBe(true);
      expect(persistenceResult.testCustomerPersisted).toBe(true);
    } else {
      console.log('❌ FAILURE: Data did not persist across page reload');
      console.log('Window types found:', persistenceResult.allWindowTypes);
      console.log('Customers found:', persistenceResult.allCustomers);
      
      // This will fail the test and show us what data is actually there
      expect(persistenceResult.testWindowTypePersisted).toBe(true);
      expect(persistenceResult.testCustomerPersisted).toBe(true);
    }
  });
});
