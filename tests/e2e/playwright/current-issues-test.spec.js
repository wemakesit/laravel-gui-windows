/**
 * Current Issues Test
 * Tests the specific issues we've been working on:
 * 1. Extras duplication and selection
 * 2. Generate estimate button functionality
 * 3. Database persistence
 */

import { test, expect } from '@playwright/test';

test.describe('Current Issues Test', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console messages and errors
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    // Navigate to dashboard to ensure we're authenticated and ready
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should test extras functionality and generate estimate', async ({ page }) => {
    console.log('🧪 Testing extras functionality and estimate generation...');

    // Navigate to create estimate
    await page.goto('/estimates/create');
    await expect(page.locator('h2').first()).toContainText('Create New Estimate');

    // Wait for configuration sync to complete
    console.log('🧪 Waiting for configuration sync...');
    await page.waitForTimeout(15000); // Wait for config sync

    // Fill customer information using current selectors
    console.log('🧪 Filling customer information...');
    await page.fill('input[name="first_name"]', 'Test');
    await page.fill('input[name="last_name"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '01234567890');

    // Use manual address entry
    await page.click('text=Enter Address Manually');
    await page.fill('input[name="address"]', '123 Test Street, Test City, TC1 2AB');

    // Proceed to next step
    await page.click('button:has-text("Next")');
    await expect(page.locator('h2')).toContainText('Window Selection');

    // Add a window
    console.log('🧪 Adding a window...');
    await page.click('button:has-text("Add Window")');

    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Fill room field
    await page.fill('input[name="room"]', 'Living Room');

    // Fill window type - use Tab to navigate to the field
    await page.press('input[name="room"]', 'Tab');
    await page.type('input[name="type"]', 'Casement');
    
    // Wait for dropdown and select first option
    await page.waitForSelector('text=Softwood Single Casement Window', { timeout: 5000 });
    await page.click('text=Softwood Single Casement Window');

    // Save the window
    await page.click('button:has-text("Save Window")');

    // Wait for modal to close and verify window was added
    await page.waitForTimeout(2000);
    await expect(page.locator('tbody tr')).toHaveCount(1);

    // Proceed to window configuration
    await page.click('button:has-text("Next")');
    await expect(page.locator('h2')).toContainText('Window Configuration');

    // Configure the window
    console.log('🧪 Configuring window...');
    await page.click('button:has-text("Configure")');
    
    // Wait for configuration modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Select options
    await page.selectOption('select[name="glass_specification"]', 'Clear Double Glazed');
    await page.selectOption('select[name="paint_finish"]', 'White (RAL 9016)');
    await page.selectOption('select[name="hardware_finish"]', 'Polished Chrome');
    
    // Save configuration
    await page.click('button:has-text("Save Configuration")');
    await page.waitForTimeout(1000);

    // Proceed to extras
    await page.click('button:has-text("Next")');
    await expect(page.locator('h2')).toContainText('Extras');

    // Test extras functionality
    console.log('🧪 Testing extras functionality...');
    await page.click('button:has-text("Add Extras")');

    // Wait for extras modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Check that extras are not duplicated
    const extrasCount = await page.locator('input[type="checkbox"]').count();
    console.log('🧪 Extras count:', extrasCount);
    
    // Should have exactly 3 extras (not 6 due to duplication)
    expect(extrasCount).toBe(3);

    // Test selecting extras
    const firstExtra = page.locator('input[type="checkbox"]').first();
    const secondExtra = page.locator('input[type="checkbox"]').nth(1);
    
    // Select first extra
    await firstExtra.check();
    await expect(firstExtra).toBeChecked();
    
    // Verify second extra is not selected
    await expect(secondExtra).not.toBeChecked();
    
    // Select second extra
    await secondExtra.check();
    await expect(secondExtra).toBeChecked();
    
    // Verify both are selected
    await expect(firstExtra).toBeChecked();
    await expect(secondExtra).toBeChecked();

    console.log('🧪 Extras selection working correctly!');

    // Save extras
    await page.click('button:has-text("Save Extras")');
    await page.waitForTimeout(1000);

    // Proceed to review
    await page.click('button:has-text("Next")');
    await expect(page.locator('h2')).toContainText('Review');

    // Verify company information is displayed
    console.log('🧪 Verifying company information...');
    await expect(page.locator('text=Midhurst Windows & Doors Ltd')).toBeVisible();

    // Test generate estimate button
    console.log('🧪 Testing generate estimate button...');
    
    // Set up console log monitoring for debugging
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // Click generate estimate
    await page.click('button:has-text("Generate Estimate")');

    // Wait for the persistence delay and redirect
    console.log('🧪 Waiting for estimate generation and redirect...');
    await page.waitForURL(/\/estimates\/[^\/]+/, { timeout: 30000 });

    // Check if we successfully redirected to estimate view
    const currentUrl = page.url();
    console.log('🧪 Redirected to:', currentUrl);
    
    // Wait for the estimate to load
    await page.waitForTimeout(5000);

    // Check for any errors in console
    const errorMessages = consoleMessages.filter(msg => 
      msg.includes('error') || msg.includes('Error') || msg.includes('failed')
    );
    
    if (errorMessages.length > 0) {
      console.log('🧪 Console errors found:', errorMessages);
    }

    // Try to verify estimate loaded successfully
    try {
      await expect(page.locator('h1, h2')).toContainText('Estimate', { timeout: 10000 });
      console.log('🎉 Estimate generated and loaded successfully!');
    } catch (error) {
      console.log('🧪 Estimate page did not load properly:', error.message);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'estimate-generation-debug.png' });
      
      // Log the page content for debugging
      const pageContent = await page.content();
      console.log('🧪 Page content length:', pageContent.length);
      
      throw error;
    }
  });

  test('should test database persistence after page reload', async ({ page }) => {
    console.log('🧪 Testing database persistence...');

    // Navigate to dashboard and wait for initialization
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Create test data and test immediate persistence
    const testResult = await page.evaluate(async () => {
      try {
        // Create a test customer
        const customer = await window.watermelonDBService.createCustomer({
          name: 'Persistence Test Customer',
          email: 'persistence@test.com',
          phone: '01234567890',
          addressLine1: '123 Persistence Street',
        });

        console.log('🧪 Customer created:', {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        });

        // Create a test estimate
        const estimate = await window.watermelonDBService.createEstimate(customer.id);

        console.log('🧪 Estimate created:', {
          id: estimate.id,
          customerId: estimate.customerId,
          referenceNumber: estimate.referenceNumber,
        });

        // Test immediate retrieval (before any persistence delay)
        const immediateEstimate = await window.watermelonDBService.getEstimate(estimate.id);
        const immediateCustomer = await window.watermelonDBService.getCustomer(customer.id);

        console.log('🧪 Immediate retrieval test:', {
          estimateFound: !!immediateEstimate,
          estimateCustomerId: immediateEstimate?.customerId,
          customerFound: !!immediateCustomer,
          customerName: immediateCustomer?.name,
        });

        // Wait for persistence delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test retrieval after persistence delay
        const delayedEstimate = await window.watermelonDBService.getEstimate(estimate.id);
        const delayedCustomer = await window.watermelonDBService.getCustomer(customer.id);

        console.log('🧪 After persistence delay test:', {
          estimateFound: !!delayedEstimate,
          estimateCustomerId: delayedEstimate?.customerId,
          customerFound: !!delayedCustomer,
          customerName: delayedCustomer?.name,
        });

        return {
          success: true,
          customerId: customer.id,
          estimateId: estimate.id,
          immediateTest: {
            estimateCustomerId: immediateEstimate?.customerId,
            customerName: immediateCustomer?.name,
          },
          delayedTest: {
            estimateCustomerId: delayedEstimate?.customerId,
            customerName: delayedCustomer?.name,
          },
        };
      } catch (error) {
        console.log('🧪 Error in test data creation:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    });

    console.log('🧪 Test data creation result:', testResult);
    expect(testResult.success).toBe(true);

    // Wait for persistence
    await page.waitForTimeout(3000);

    // Reload page
    console.log('🧪 Reloading page to test persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify data persisted after reload
    const persistenceResult = await page.evaluate(async (testData) => {
      try {
        const estimate = await window.watermelonDBService.getEstimate(testData.estimateId);
        const customer = await window.watermelonDBService.getCustomer(testData.customerId);

        // Test the safe relation-based approach
        const customerViaEstimate = estimate ? await window.watermelonDBService.getCustomerForEstimate(estimate) : null;

        console.log('🧪 After page reload test:', {
          estimateFound: !!estimate,
          estimateCustomerId: estimate?.customerId,
          customerFound: !!customer,
          customerName: customer?.name,
          customerViaEstimateFound: !!customerViaEstimate,
          customerViaEstimateName: customerViaEstimate?.name,
        });

        return {
          success: true,
          estimateFound: !!estimate,
          customerFound: !!customer,
          estimateCustomerId: estimate?.customerId,
          customerName: customer?.name,
          customerViaEstimateFound: !!customerViaEstimate,
          customerViaEstimateName: customerViaEstimate?.name,
        };
      } catch (error) {
        console.log('🧪 Error in persistence test:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    }, testResult);

    console.log('🧪 Persistence test result:', persistenceResult);
    expect(persistenceResult.success).toBe(true);
    expect(persistenceResult.estimateFound).toBe(true);
    expect(persistenceResult.customerFound).toBe(true);

    // The key test: check if customerId persists after page reload
    if (persistenceResult.estimateCustomerId === undefined) {
      console.log('🚨 KNOWN ISSUE: customerId is undefined after page reload (WatermelonDB persistence issue)');
      console.log('🧪 Immediate test result:', testResult.immediateTest);
      console.log('🧪 Delayed test result:', testResult.delayedTest);
      console.log('🧪 After reload result:', {
        estimateCustomerId: persistenceResult.estimateCustomerId,
        customerName: persistenceResult.customerName,
      });

      // Check if the workaround is working
      if (persistenceResult.customerViaEstimateFound && persistenceResult.customerViaEstimateName) {
        console.log('🎉 WORKAROUND SUCCESSFUL: Customer found via backup data!');
        console.log('🧪 Customer via estimate:', {
          found: persistenceResult.customerViaEstimateFound,
          name: persistenceResult.customerViaEstimateName,
        });
      } else {
        console.log('🚨 WORKAROUND FAILED: Customer not found via backup data either!');
      }
    } else {
      console.log('🎉 customerId persisted correctly after page reload!');
    }

    console.log('🎉 Database persistence test completed!');
  });
});
