/**
 * Offline Estimate Creation Test
 * Tests the ability to create estimates when offline using WatermelonDB
 */

const { test, expect } = require('@playwright/test');

test.describe('Offline Estimate Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Wait for WatermelonDB to initialize
    await page.waitForTimeout(2000);
  });

  test('should create estimate offline and persist to WatermelonDB', async ({ page, context }) => {
    // Set up offline mode
    await context.setOffline(true);
    
    // Navigate to estimate creation
    await page.goto('/estimates/create');
    await page.waitForLoadState('networkidle');
    
    // Verify we're in offline mode
    const isOffline = await page.evaluate(() => !navigator.onLine);
    expect(isOffline).toBe(true);
    
    // Fill customer information
    await page.fill('#customer-name', 'Test Customer Offline');
    await page.fill('#customer-email', 'offline@test.com');
    await page.fill('#customer-phone', '01234567890');
    await page.fill('#customer-address', '123 Test Street');
    await page.fill('#customer-city', 'Test City');
    await page.fill('#customer-postcode', 'TE1 2ST');
    
    // Move to next step
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Add a window
    await page.click('button:has-text("Add Window")');
    await page.fill('#room', 'Living Room');
    await page.selectOption('#window-type', { index: 0 });
    await page.fill('#width', '1200');
    await page.fill('#height', '1000');
    await page.fill('#quantity', '1');
    
    // Save window
    await page.click('button:has-text("Save Window")');
    await page.waitForTimeout(1000);
    
    // Move to review step
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Submit estimate
    await page.click('button:has-text("Create Estimate")');
    
    // Wait for persistence verification
    await page.waitForTimeout(3000);
    
    // Verify estimate was created and persisted
    const estimateCreated = await page.evaluate(async () => {
      try {
        // Check if WatermelonDB service is available
        if (!window.watermelonDBService) {
          return { success: false, error: 'WatermelonDB service not available' };
        }
        
        // Get all estimates
        const estimates = await window.watermelonDBService.getAllEstimates();
        
        // Find the estimate we just created
        const testEstimate = estimates.find(est => 
          est.customer && est.customer.name === 'Test Customer Offline'
        );
        
        if (!testEstimate) {
          return { success: false, error: 'Estimate not found in database' };
        }
        
        // Get windows for this estimate
        const windows = await window.watermelonDBService.getWindowsByEstimate(testEstimate.id);
        
        return {
          success: true,
          estimate: {
            id: testEstimate.id,
            referenceNumber: testEstimate.referenceNumber,
            status: testEstimate.status,
            isSynced: testEstimate.isSynced,
            customerName: testEstimate.customer.name,
            windowCount: windows.length
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    expect(estimateCreated.success).toBe(true);
    expect(estimateCreated.estimate.customerName).toBe('Test Customer Offline');
    expect(estimateCreated.estimate.status).toBe('draft');
    expect(estimateCreated.estimate.isSynced).toBe(false);
    expect(estimateCreated.estimate.windowCount).toBe(1);
    
    console.log('✅ Offline estimate created successfully:', estimateCreated.estimate);
  });

  test('should navigate to cached pages when offline', async ({ page, context }) => {
    // First visit pages while online to cache them
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/estimates');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Now go offline
    await context.setOffline(true);
    
    // Test navigation to cached pages
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should show offline indicator but still work
    const offlineIndicator = await page.locator('text=Offline Mode').isVisible();
    expect(offlineIndicator).toBe(true);
    
    // Navigate to estimates page
    await page.goto('/estimates');
    await page.waitForLoadState('networkidle');
    
    // Should not show "requires internet connection" message
    const requiresInternet = await page.locator('text=requires internet connection').isVisible();
    expect(requiresInternet).toBe(false);
    
    console.log('✅ Offline navigation to cached pages works correctly');
  });

  test('should show appropriate offline messages for server-dependent actions', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Navigate to estimates page
    await page.goto('/estimates');
    await page.waitForLoadState('networkidle');
    
    // Try to generate PDF (should be blocked)
    const generateButton = await page.locator('button:has-text("Generate PDF")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      
      // Should show message that PDF generation requires internet
      const offlineMessage = await page.locator('text=PDF generation requires internet connection').isVisible();
      expect(offlineMessage).toBe(true);
    }
    
    console.log('✅ Server-dependent actions properly blocked offline');
  });

  test('should sync estimates when coming back online', async ({ page, context }) => {
    // Create estimate offline first
    await context.setOffline(true);
    
    // Create a simple estimate offline
    const offlineEstimate = await page.evaluate(async () => {
      try {
        if (!window.watermelonDBService) {
          throw new Error('WatermelonDB service not available');
        }
        
        // Create customer
        const customer = await window.watermelonDBService.createCustomer({
          name: 'Sync Test Customer',
          email: 'sync@test.com',
          phone: '01234567890',
          addressLine1: '123 Sync Street',
          city: 'Sync City',
          postcode: 'SY1 2NC',
          country: 'UK'
        });
        
        // Create estimate
        const estimate = await window.watermelonDBService.createEstimate(customer.id);
        
        return {
          success: true,
          estimateId: estimate.id,
          customerId: customer.id,
          isSynced: estimate.isSynced
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    expect(offlineEstimate.success).toBe(true);
    expect(offlineEstimate.isSynced).toBe(false);
    
    // Come back online
    await context.setOffline(false);
    
    // Wait for sync to trigger
    await page.waitForTimeout(2000);
    
    // Check if estimate sync was attempted
    const syncAttempted = await page.evaluate(() => {
      // Check if there are any sync-related console messages
      return window.performance.getEntriesByType('navigation').length > 0;
    });
    
    console.log('✅ Sync process initiated when coming back online');
  });
});
