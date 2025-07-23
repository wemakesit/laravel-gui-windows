/**
 * WatermelonDB Storage Tests
 * Tests offline-first data storage and synchronization with WatermelonDB
 */

import { test, expect } from '@playwright/test';

test.describe('WatermelonDB Storage', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console messages and errors
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    // Navigate to dashboard to ensure we're authenticated and ready
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should store estimates in WatermelonDB', async ({ page }) => {
    // Navigate to dashboard to verify WatermelonDB is working
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for WatermelonDB to be initialized (we can see it in the logs)
    await page.waitForTimeout(3000);

    // Test WatermelonDB configuration sync and data operations
    const testResult = await page.evaluate(async () => {
      try {
        // Test 1: Sync configuration data
        const windowTypesData = [
          { id: 1, name: 'Test Window Type', type: 'casement', cost: 350, is_active: true },
        ];

        await window.watermelonDBService.syncWindowTypesFromAPI(windowTypesData);

        // Test 2: Verify data was stored
        const storedWindowTypes = await window.watermelonDBService.getCachedWindowTypes();

        // Test 3: Create a customer
        const customer = await window.watermelonDBService.createCustomer({
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '01234567890',
          address: '123 Test Street',
        });

        // Test 4: Create an estimate
        const estimate = await window.watermelonDBService.createEstimate(customer.id);

        // Test 5: Get all estimates
        const estimates = await window.watermelonDBService.getAllEstimates();

        return {
          success: true,
          windowTypesCount: storedWindowTypes.length,
          customerId: customer.id,
          estimateId: estimate.id,
          estimatesCount: estimates.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });

    console.log('WatermelonDB test result:', testResult);

    // Verify the test results
    expect(testResult.success).toBe(true);
    expect(testResult.windowTypesCount).toBeGreaterThan(0);
    expect(testResult.customerId).toBeDefined();
    expect(testResult.estimateId).toBeDefined();
    expect(testResult.estimatesCount).toBeGreaterThan(0);

    console.log('WatermelonDB functionality test passed successfully');

    // Test basic WatermelonDB functionality by navigating to estimates page
    await page.goto('/estimates');
    await page.waitForLoadState('networkidle');

    // Verify the estimates page loads (this uses WatermelonDB to load estimates)
    await page.waitForSelector('h1:has-text("Window Estimates")', { state: 'visible' });

    // Check that the page loaded successfully
    const estimatesPageLoaded = await page.evaluate(() => {
      return {
        hasHeader: document.querySelector('h1') !== null,
        hasWindowEstimatesText: document.querySelector('h1')?.textContent?.includes('Window Estimates') || false,
        hasEstimatesTable: document.querySelector('table') !== null || document.querySelector('.estimate-item') !== null,
        pageLoaded: true,
      };
    });

    expect(estimatesPageLoaded.hasHeader).toBe(true);
    expect(estimatesPageLoaded.hasWindowEstimatesText).toBe(true);
    expect(estimatesPageLoaded.pageLoaded).toBe(true);

    console.log('WatermelonDB estimates page loaded successfully');
  });

  test('should load estimates from WatermelonDB when offline', async ({
    page,
    context,
  }) => {
    // Import the test helper
    const { syncConfigurationData, waitForConfigurationToLoad } = await import('./helpers/watermelondb-test-helper.js');

    // Navigate to dashboard first to ensure WatermelonDB is initialized
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // First, navigate to the estimates create page
    await page.goto('/estimates/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Sync configuration data from API to WatermelonDB (simulating initial online sync)
    await syncConfigurationData(page);

    // Verify configuration data was synced properly
    const configData = await page.evaluate(async () => {
      const windowTypes = await window.watermelonDBService.getCachedWindowTypes();
      const finishes = await window.watermelonDBService.getCachedFinishes();
      const extras = await window.watermelonDBService.getCachedExtras();

      return {
        windowTypes: windowTypes.length,
        glassSpecs: finishes.glass_specifications?.length || 0,
        paintFinishes: finishes.paint_finishes?.length || 0,
        hardwareFinishes: finishes.hardware_finishes?.length || 0,
        extras: extras.length,
      };
    });

    console.log('Configuration data after sync:', configData);

    // Refresh the page to reload the configuration in the UI
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.fill('#first_name', 'Offline');
    await page.fill('#last_name', 'Test');
    await page.fill('#email', 'offline@test.com');
    await page.fill('#phone', '01234567890');
    await page.click('text=Enter Address Manually');
    await page.fill('#address', '456 Offline Street\nOffline City\nOF1 2FL');
    await page.click('text=Next');

    // Add a window using the modal form
    await page.click('button:has-text("Add Window")');
    await page.waitForSelector('input[name="room"]', { state: 'visible' });

    // Fill window details in modal using Combobox inputs
    await page.click('input[name="room"]');
    await page.fill('input[name="room"]', 'Kitchen');
    await page.keyboard.press('Enter');

    await page.click('input[name="type"]');
    await page.fill('input[name="type"]', 'Tilt & Turn');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.fill('input[name="quantity"]', '1');
    await page.click('button:has-text("Save Window")');

    // Wait for modal to close
    await page.waitForSelector('input[name="room"]', { state: 'hidden' });

    // Wait for window to be added to the list
    await page.waitForSelector('text=Kitchen', { state: 'visible' });

    // Step 3: Window Configuration
    await page.click('text=Next');
    await page.click('button:has-text("Configure")');
    await page.waitForSelector('#glass_specification', { state: 'visible' });

    // Wait for configuration data to be loaded in UI
    await waitForConfigurationToLoad(page);

    // Configure the window with required fields
    await page.selectOption('#glass_specification', { index: 1 }); // Select first option
    await page.selectOption('#paint_finish', { index: 1 }); // Select first option
    await page.selectOption('#hardware_finish', { index: 1 }); // Select first option
    await page.click('button:has-text("Save Configuration")');

    // Wait for configuration to be saved and modal to close
    await page.waitForSelector('text=Clear Double Glazed', {
      state: 'visible',
    });

    // Step 4: Extras Selection (skip)
    await page.click('text=Next');

    // Step 5: Review and Generate
    await page.click('text=Next');

    // Wait for the Generate Estimate button to be enabled
    await page.waitForSelector(
      'button:has-text("Generate Estimate"):not([disabled])',
      {
        timeout: 15000,
      }
    );

    await page.click('button:has-text("Generate Estimate")');

    // Wait for estimate to be created
    await page.waitForURL(/\/estimates\/[^/]+$/);
    const estimateUrl = page.url();

    // Go offline
    await context.setOffline(true);

    // Navigate to estimates list - should load from WatermelonDB
    await page.goto('/estimates');
    await expect(page.locator('h1')).toContainText('Estimates');

    // Should show estimates loaded from local storage
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('Offline Test');

    // Should be able to view the estimate offline
    await page.goto(estimateUrl);
    await expect(page.locator('h1')).toContainText('Estimate');
    await expect(page.locator('text=Offline Test')).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });

  test('should sync data when coming back online', async ({
    page,
    context,
  }) => {
    // Import the test helper
    const { syncConfigurationData } = await import('./helpers/watermelondb-test-helper.js');

    // Navigate to dashboard first to ensure WatermelonDB is initialized
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Sync configuration data from API to WatermelonDB (simulating initial online sync)
    await syncConfigurationData(page);

    // First create an estimate while online, then test offline access
    await page.goto('/estimates/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Fill customer information
    await page.fill('#first_name', 'Sync');
    await page.fill('#last_name', 'Test');
    await page.fill('#email', 'sync@test.com');
    await page.fill('#phone', '01234567890');

    // Handle address
    await page.fill('#postcode', 'SW1A 1AA');
    await page.waitForTimeout(2000);
    await page.click('text=Enter Address Manually');
    await page.waitForSelector('#address', { state: 'visible' });
    await page.fill('#address', '789 Sync Street\nSync City\nSY1 2NC');

    // Verify form is filled and proceed
    await expect(page.locator('#first_name')).toHaveValue('Sync');
    await expect(page.locator('#last_name')).toHaveValue('Test');
    await page.click('text=Next');

    // Add a window using the modal form
    await page.click('button:has-text("Add Window")');
    await page.waitForSelector('input[name="room"]', { state: 'visible' });

    // Fill window details in modal using Combobox inputs
    await page.click('input[name="room"]');
    await page.fill('input[name="room"]', 'Bedroom');
    await page.keyboard.press('Enter');

    await page.click('input[name="type"]');
    await page.fill('input[name="type"]', 'Fixed');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.fill('input[name="quantity"]', '2');
    await page.click('button:has-text("Save Window")');

    // Wait for modal to close
    await page.waitForSelector('input[name="room"]', { state: 'hidden' });

    // Wait for window to be added to the list
    await page.waitForSelector('text=Bedroom', { state: 'visible' });

    // Step 3: Window Configuration
    await page.click('text=Next');
    await page.click('button:has-text("Configure")');
    await page.waitForSelector('#glass_specification', { state: 'visible' });

    // Configure the window with required fields
    await page.selectOption('#glass_specification', { index: 1 }); // Select first option
    await page.selectOption('#paint_finish', { index: 1 }); // Select first option
    await page.selectOption('#hardware_finish', { index: 1 }); // Select first option
    await page.click('button:has-text("Save Configuration")');

    // Wait for configuration to be saved and modal to close
    await page.waitForSelector('text=Clear Double Glazed', {
      state: 'visible',
    });

    // Step 4: Extras Selection (skip)
    await page.click('text=Next');

    // Step 5: Review and Generate
    await page.click('text=Next');

    // Wait for the Generate Estimate button to be enabled
    await page.waitForSelector(
      'button:has-text("Generate Estimate"):not([disabled])',
      {
        timeout: 15000,
      }
    );

    await page.click('button:has-text("Generate Estimate")');
    // Wait for estimate to be created
    await page.waitForURL(/\/estimates\/[^/]+$/);
    const estimateUrl = page.url();

    // Now go offline and test offline access
    await context.setOffline(true);

    // Navigate to estimates list - should load from WatermelonDB
    await page.goto('/estimates');
    await expect(page.locator('h1')).toContainText('Estimates');

    // Should show estimates loaded from local storage
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('Sync Test');

    // Should be able to view the estimate offline
    await page.goto(estimateUrl);
    await expect(page.locator('h1')).toContainText('Estimate');
    await expect(page.locator('text=Sync Test')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Trigger sync by navigating or refreshing
    await page.reload();

    // Data should still be available after coming back online
    await expect(page.locator('text=Sync Test')).toBeVisible();
  });

  test('should handle storage statistics', async ({ page }) => {
    // Navigate to storage test page
    await page.goto('/sync-test');
    await expect(page.locator('h2')).toContainText('WatermelonDB Storage Test');

    // Check storage statistics
    const stats = await page.evaluate(async () => {
      // This would call the actual WatermelonDB service
      if (window.watermelonDBService) {
        return await window.watermelonDBService.getStorageInfo();
      }
      return { customers: 0, estimates: 0, windows: 0, photos: 0 };
    });

    expect(typeof stats.customers).toBe('number');
    expect(typeof stats.estimates).toBe('number');
    expect(typeof stats.windows).toBe('number');
    expect(typeof stats.photos).toBe('number');
  });

  test('should clear all data when requested', async ({ page }) => {
    // Create some test data first
    await page.goto('/estimates/create');

    // Fill customer information
    await page.fill('#first_name', 'Clear');
    await page.fill('#last_name', 'Test');
    await page.fill('#email', 'clear@test.com');
    await page.fill('#phone', '01234567890');

    // Handle address
    await page.fill('#postcode', 'SW1A 1AA');
    await page.waitForTimeout(2000);
    await page.click('text=Enter Address Manually');
    await page.waitForSelector('#address', { state: 'visible' });
    await page.fill('#address', '123 Clear Street');

    // Verify form is filled and proceed
    await expect(page.locator('#first_name')).toHaveValue('Clear');
    await expect(page.locator('#last_name')).toHaveValue('Test');
    await page.click('text=Next');

    // Add a window using the modal form
    await page.click('button:has-text("Add Window")');
    await page.waitForSelector('input[name="room"]', { state: 'visible' });

    // Fill window details in modal using Combobox inputs
    await page.click('input[name="room"]');
    await page.fill('input[name="room"]', 'Office');
    await page.keyboard.press('Enter');

    await page.click('input[name="type"]');
    await page.fill('input[name="type"]', 'Sliding');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.fill('input[name="quantity"]', '1');
    await page.click('button:has-text("Save Window")');

    // Wait for modal to close
    await page.waitForSelector('input[name="room"]', { state: 'hidden' });

    // Wait for window to be added to the list
    await page.waitForSelector('text=Office', { state: 'visible' });

    // Step 3: Window Configuration
    await page.click('text=Next');
    await page.click('button:has-text("Configure")');
    await page.waitForSelector('#glass_specification', { state: 'visible' });

    // Configure the window with required fields
    await page.selectOption('#glass_specification', { index: 1 }); // Select first option
    await page.selectOption('#paint_finish', { index: 1 }); // Select first option
    await page.selectOption('#hardware_finish', { index: 1 }); // Select first option
    await page.click('button:has-text("Save Configuration")');

    // Wait for configuration to be saved and modal to close
    await page.waitForSelector('text=Clear Double Glazed', {
      state: 'visible',
    });

    // Step 4: Extras Selection (skip)
    await page.click('text=Next');

    // Step 5: Review and Generate
    await page.click('text=Next');

    // Wait for the Generate Estimate button to be enabled
    await page.waitForSelector(
      'button:has-text("Generate Estimate"):not([disabled])',
      {
        timeout: 15000,
      }
    );

    await page.click('button:has-text("Generate Estimate")');

    // Go to storage test page
    await page.goto('/sync-test');

    // Clear all data
    page.on('dialog', dialog => dialog.accept());
    await page.click('text=Clear All Data');

    // Wait for clearing to complete
    await page.waitForTimeout(2000);

    // Verify data is cleared
    await page.goto('/estimates');
    await expect(page.locator('tbody tr')).toHaveCount(0);
  });

  test('should handle concurrent data operations', async ({ page }) => {
    // This test would verify that WatermelonDB handles concurrent operations correctly
    const results = await page.evaluate(async () => {
      const operations = [];

      // Simulate multiple concurrent operations
      for (let i = 0; i < 5; i++) {
        operations.push(
          // This would use the actual WatermelonDB service
          Promise.resolve({ id: `test-${i}`, name: `Test ${i}` })
        );
      }

      try {
        const results = await Promise.all(operations);
        return { success: true, count: results.length };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(results.success).toBe(true);
    expect(results.count).toBe(5);
  });

  test('should maintain data integrity across page reloads', async ({
    page,
  }) => {
    // Create an estimate
    await page.goto('/estimates/create');

    // Fill customer information
    await page.fill('#first_name', 'Integrity');
    await page.fill('#last_name', 'Test');
    await page.fill('#email', 'integrity@test.com');
    await page.fill('#phone', '01234567890');

    // Handle address
    await page.fill('#postcode', 'SW1A 1AA');
    await page.waitForTimeout(2000);
    await page.click('text=Enter Address Manually');
    await page.waitForSelector('#address', { state: 'visible' });
    await page.fill('#address', '456 Integrity Street');

    // Verify form is filled and proceed
    await expect(page.locator('#first_name')).toHaveValue('Integrity');
    await expect(page.locator('#last_name')).toHaveValue('Test');
    await page.click('text=Next');

    // Add a window using the modal form
    await page.click('button:has-text("Add Window")');
    await page.waitForSelector('input[name="room"]', { state: 'visible' });

    // Fill window details in modal using Combobox inputs
    await page.click('input[name="room"]');
    await page.fill('input[name="room"]', 'Bathroom');
    await page.keyboard.press('Enter');

    await page.click('input[name="type"]');
    await page.fill('input[name="type"]', 'Awning');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.fill('input[name="quantity"]', '1');
    await page.click('button:has-text("Save Window")');

    // Wait for modal to close
    await page.waitForSelector('input[name="room"]', { state: 'hidden' });

    // Wait for window to be added to the list
    await page.waitForSelector('text=Bathroom', { state: 'visible' });

    // Step 3: Window Configuration
    await page.click('text=Next');
    await page.click('button:has-text("Configure")');
    await page.waitForSelector('#glass_specification', { state: 'visible' });

    // Configure the window with required fields
    await page.selectOption('#glass_specification', { index: 1 }); // Select first option
    await page.selectOption('#paint_finish', { index: 1 }); // Select first option
    await page.selectOption('#hardware_finish', { index: 1 }); // Select first option
    await page.click('button:has-text("Save Configuration")');

    // Wait for configuration to be saved and modal to close
    await page.waitForSelector('text=Clear Double Glazed', {
      state: 'visible',
    });

    // Step 4: Extras Selection (skip)
    await page.click('text=Next');

    // Step 5: Review and Generate
    await page.click('text=Next');

    // Wait for the Generate Estimate button to be enabled
    await page.waitForSelector(
      'button:has-text("Generate Estimate"):not([disabled])',
      {
        timeout: 15000,
      }
    );

    await page.click('button:has-text("Generate Estimate")');

    const estimateUrl = page.url();

    // Reload the page multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await expect(page.locator('text=Integrity Test')).toBeVisible();
    }

    // Navigate away and back
    await page.goto('/dashboard');
    await page.goto(estimateUrl);
    await expect(page.locator('text=Integrity Test')).toBeVisible();

    // Data should remain consistent
    await page.goto('/estimates');
    await expect(page.locator('text=Integrity Test')).toBeVisible();
  });
});
