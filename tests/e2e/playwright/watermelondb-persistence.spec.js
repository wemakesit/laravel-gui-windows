/**
 * WatermelonDB Persistence Tests
 * Tests that data persists correctly across page reloads and browser sessions
 */

import { test, expect } from '@playwright/test';

test.describe('WatermelonDB Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console messages and errors
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    // Navigate to dashboard to ensure we're authenticated and ready
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should persist data across page reloads', async ({ page }) => {
    console.log('🧪 Testing WatermelonDB persistence across page reloads...');

    // Step 1: Navigate to dashboard and wait for WatermelonDB to initialize
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for database initialization

    // Step 2: Create test data and verify it's stored
    const testData = await page.evaluate(async () => {
      try {
        console.log('🧪 Creating test data...');
        
        // Create a test window type
        await window.watermelonDBService.syncWindowTypesFromAPI([
          { id: 999, name: 'Persistence Test Window', type: 'test', cost: 999, is_active: true }
        ]);

        // Create a test customer
        const customer = await window.watermelonDBService.createCustomer({
          name: 'Persistence Test Customer',
          email: 'persistence@test.com',
          phone: '01234567890',
          address: '123 Persistence Street',
        });

        // Create a test estimate
        const estimate = await window.watermelonDBService.createEstimate(customer.id);

        // Verify data was created
        const windowTypes = await window.watermelonDBService.getCachedWindowTypes();
        const customers = await window.watermelonDBService.getAllCustomers();
        const estimates = await window.watermelonDBService.getAllEstimates();

        console.log('🧪 Test data created successfully');
        
        return {
          success: true,
          windowTypesCount: windowTypes.length,
          customersCount: customers.length,
          estimatesCount: estimates.length,
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

    console.log('🧪 Test data creation result:', testData);
    expect(testData.success).toBe(true);
    expect(testData.windowTypesCount).toBeGreaterThan(0);
    expect(testData.customersCount).toBeGreaterThan(0);
    expect(testData.estimatesCount).toBeGreaterThan(0);

    // Step 3: Wait for data to be persisted
    await page.waitForTimeout(2000); // Give time for autosave

    // Step 4: Reload the page to test persistence
    console.log('🧪 Reloading page to test persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for database to load

    // Step 5: Verify data persisted after reload
    const persistedData = await page.evaluate(async () => {
      try {
        console.log('🧪 Checking persisted data...');
        
        // Check if data persisted
        const windowTypes = await window.watermelonDBService.getCachedWindowTypes();
        const customers = await window.watermelonDBService.getAllCustomers();
        const estimates = await window.watermelonDBService.getAllEstimates();

        // Look for our specific test data
        const testWindowType = windowTypes.find(wt => wt.name === 'Persistence Test Window');
        const testCustomer = customers.find(c => c.name === 'Persistence Test Customer');

        console.log('🧪 Persisted data check completed');
        
        return {
          success: true,
          windowTypesCount: windowTypes.length,
          customersCount: customers.length,
          estimatesCount: estimates.length,
          hasTestWindowType: !!testWindowType,
          hasTestCustomer: !!testCustomer,
          testWindowType: testWindowType,
          testCustomer: testCustomer,
        };
      } catch (error) {
        console.error('🧪 Failed to check persisted data:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    });

    console.log('🧪 Persisted data check result:', persistedData);

    // Verify data persisted correctly
    expect(persistedData.success).toBe(true);
    expect(persistedData.windowTypesCount).toBeGreaterThan(0);
    expect(persistedData.customersCount).toBeGreaterThan(0);
    expect(persistedData.estimatesCount).toBeGreaterThan(0);
    expect(persistedData.hasTestWindowType).toBe(true);
    expect(persistedData.hasTestCustomer).toBe(true);

    console.log('🎉 Persistence test passed! Data survived page reload.');
  });

  test('should persist configuration data across page reloads', async ({ page }) => {
    console.log('🧪 Testing configuration data persistence...');

    // Step 1: Navigate to dashboard and sync configuration
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 2: Sync configuration data
    const configSync = await page.evaluate(async () => {
      try {
        console.log('🧪 Syncing configuration data...');
        
        // Sync test configuration data
        await window.watermelonDBService.syncWindowTypesFromAPI([
          { id: 1, name: 'Config Test Window 1', type: 'casement', cost: 350, is_active: true },
          { id: 2, name: 'Config Test Window 2', type: 'sash', cost: 450, is_active: true },
        ]);

        await window.watermelonDBService.syncFinishesFromAPI({
          glass_specifications: [
            { id: 1, name: 'Test Glass 1', cost: 0, is_active: true },
            { id: 2, name: 'Test Glass 2', cost: 25, is_active: true },
          ],
          paint_finishes: [
            { id: 1, name: 'Test Paint 1', cost: 0, is_active: true },
            { id: 2, name: 'Test Paint 2', cost: 15, is_active: true },
          ],
          hardware_finishes: [
            { id: 1, name: 'Test Hardware 1', cost: 0, is_active: true },
            { id: 2, name: 'Test Hardware 2', cost: 20, is_active: true },
          ],
        });

        await window.watermelonDBService.syncExtrasFromAPI([
          { id: 1, name: 'Test Extra 1', cost: 45, category: 'security', is_active: true },
          { id: 2, name: 'Test Extra 2', cost: 25, category: 'ventilation', is_active: true },
        ]);

        // Verify sync worked
        const windowTypes = await window.watermelonDBService.getCachedWindowTypes();
        const finishes = await window.watermelonDBService.getCachedFinishes();
        const extras = await window.watermelonDBService.getCachedExtras();

        console.log('🧪 Configuration sync completed');
        
        return {
          success: true,
          windowTypesCount: windowTypes.length,
          glassSpecsCount: finishes.glass_specifications?.length || 0,
          paintFinishesCount: finishes.paint_finishes?.length || 0,
          hardwareFinishesCount: finishes.hardware_finishes?.length || 0,
          extrasCount: extras.length,
        };
      } catch (error) {
        console.error('🧪 Configuration sync failed:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    });

    console.log('🧪 Configuration sync result:', configSync);
    expect(configSync.success).toBe(true);
    expect(configSync.windowTypesCount).toBeGreaterThanOrEqual(2);
    expect(configSync.glassSpecsCount).toBeGreaterThanOrEqual(2);
    expect(configSync.paintFinishesCount).toBeGreaterThanOrEqual(2);
    expect(configSync.hardwareFinishesCount).toBeGreaterThanOrEqual(2);
    expect(configSync.extrasCount).toBeGreaterThanOrEqual(2);

    // Step 3: Wait for persistence and reload
    await page.waitForTimeout(2000);
    console.log('🧪 Reloading page to test configuration persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 4: Verify configuration persisted
    const persistedConfig = await page.evaluate(async () => {
      try {
        console.log('🧪 Checking persisted configuration...');
        
        const windowTypes = await window.watermelonDBService.getCachedWindowTypes();
        const finishes = await window.watermelonDBService.getCachedFinishes();
        const extras = await window.watermelonDBService.getCachedExtras();

        console.log('🧪 Configuration persistence check completed');
        
        return {
          success: true,
          windowTypesCount: windowTypes.length,
          glassSpecsCount: finishes.glass_specifications?.length || 0,
          paintFinishesCount: finishes.paint_finishes?.length || 0,
          hardwareFinishesCount: finishes.hardware_finishes?.length || 0,
          extrasCount: extras.length,
          hasTestData: windowTypes.some(wt => wt.name.includes('Config Test')),
        };
      } catch (error) {
        console.error('🧪 Configuration persistence check failed:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    });

    console.log('🧪 Configuration persistence result:', persistedConfig);

    // Verify configuration persisted
    expect(persistedConfig.success).toBe(true);
    expect(persistedConfig.windowTypesCount).toBeGreaterThanOrEqual(2);
    expect(persistedConfig.glassSpecsCount).toBeGreaterThanOrEqual(2);
    expect(persistedConfig.paintFinishesCount).toBeGreaterThanOrEqual(2);
    expect(persistedConfig.hardwareFinishesCount).toBeGreaterThanOrEqual(2);
    expect(persistedConfig.extrasCount).toBeGreaterThanOrEqual(2);
    expect(persistedConfig.hasTestData).toBe(true);

    console.log('🎉 Configuration persistence test passed!');
  });
});
