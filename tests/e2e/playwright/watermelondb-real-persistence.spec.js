/**
 * Real WatermelonDB Persistence Test
 * Tests actual data persistence across page reloads
 */

import { test, expect } from '@playwright/test';

test.describe('WatermelonDB Real Persistence', () => {
  test('should persist data across page reloads in the actual app', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log('🧪 Testing real WatermelonDB persistence...');

    // Step 1: Navigate to dashboard
    await page.goto('http://localhost:8888/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for WatermelonDB to initialize

    // Step 2: Create test data using the actual WatermelonDB service
    const dataCreationResult = await page.evaluate(async () => {
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
          { 
            id: 999, 
            name: 'Real Persistence Test Window', 
            type: 'test', 
            cost: 999, 
            is_active: true 
          }
        ]);

        // Create test customer
        const customer = await window.watermelonDBService.createCustomer({
          name: 'Real Persistence Test Customer',
          email: 'realpersistence@test.com',
          phone: '01234567890',
          address: '123 Real Persistence Street',
        });

        // Create test estimate
        const estimate = await window.watermelonDBService.createEstimate(customer.id);

        // Verify data was created
        const windowTypes = await window.watermelonDBService.getCachedWindowTypes();
        const customers = await window.watermelonDBService.getAllCustomers();
        const estimates = await window.watermelonDBService.getAllEstimates();

        console.log('🧪 Test data created successfully');
        console.log('🧪 Window types:', windowTypes.length);
        console.log('🧪 Customers:', customers.length);
        console.log('🧪 Estimates:', estimates.length);

        return {
          success: true,
          windowTypesCount: windowTypes.length,
          customersCount: customers.length,
          estimatesCount: estimates.length,
          testWindowType: windowTypes.find(wt => wt.name === 'Real Persistence Test Window'),
          testCustomer: customers.find(c => c.name === 'Real Persistence Test Customer'),
          customerId: customer.id,
          estimateId: estimate.id,
        };
      } catch (error) {
        console.error('🧪 Failed to create test data:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    });

    console.log('🧪 Data creation result:', dataCreationResult);
    expect(dataCreationResult.success).toBe(true);
    expect(dataCreationResult.windowTypesCount).toBeGreaterThan(0);
    expect(dataCreationResult.customersCount).toBeGreaterThan(0);
    expect(dataCreationResult.estimatesCount).toBeGreaterThan(0);
    expect(dataCreationResult.testWindowType).toBeDefined();
    expect(dataCreationResult.testCustomer).toBeDefined();

    // Step 3: Wait for data to be persisted to IndexedDB
    console.log('🧪 Waiting for data to be persisted to IndexedDB...');
    await page.waitForTimeout(3000); // Wait for persistence

    // Step 4: Reload the page to test persistence
    console.log('🧪 Reloading page to test persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for database to load from IndexedDB

    // Step 5: Check if data persisted after reload
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
        const estimates = await window.watermelonDBService.getAllEstimates();

        const testWindowType = windowTypes.find(wt => wt.name === 'Real Persistence Test Window');
        const testCustomer = customers.find(c => c.name === 'Real Persistence Test Customer');

        console.log('🧪 Persistence check completed');
        console.log('🧪 Window types after reload:', windowTypes.length);
        console.log('🧪 Customers after reload:', customers.length);
        console.log('🧪 Estimates after reload:', estimates.length);
        console.log('🧪 Test window type found:', !!testWindowType);
        console.log('🧪 Test customer found:', !!testCustomer);

        return {
          success: true,
          windowTypesCount: windowTypes.length,
          customersCount: customers.length,
          estimatesCount: estimates.length,
          testWindowTypePersisted: !!testWindowType,
          testCustomerPersisted: !!testCustomer,
          allWindowTypes: windowTypes.map(wt => ({ id: wt.id, name: wt.name })),
          allCustomers: customers.map(c => ({ id: c.id, name: c.name })),
          allEstimates: estimates.map(e => ({ id: e.id, customerId: e.customerId })),
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
      expect(persistenceResult.windowTypesCount).toBeGreaterThan(0);
      expect(persistenceResult.customersCount).toBeGreaterThan(0);
      expect(persistenceResult.estimatesCount).toBeGreaterThan(0);
    } else {
      console.log('❌ FAILURE: Data did not persist across page reload');
      console.log('Window types found:', persistenceResult.allWindowTypes);
      console.log('Customers found:', persistenceResult.allCustomers);
      console.log('Estimates found:', persistenceResult.allEstimates);
      
      // This will fail the test and show us what data is actually there
      expect(persistenceResult.testWindowTypePersisted).toBe(true);
      expect(persistenceResult.testCustomerPersisted).toBe(true);
    }

    console.log('🎉 Real persistence test completed successfully!');
  });
});
