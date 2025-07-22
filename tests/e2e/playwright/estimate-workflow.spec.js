/**
 * Estimate Workflow Tests
 * Tests the complete estimate creation, viewing, and management workflow
 */

const { test, expect } = require('@playwright/test');

test.describe('Estimate Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console messages and errors
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    // Login before each test
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('text=Log in');
    await page.waitForURL('/dashboard');
  });

  test('should create a complete estimate', async ({ page }) => {
    // Navigate to create estimate
    await page.goto('/estimates/create');
    await expect(page.locator('h1')).toContainText('Create Estimate');

    // Fill customer information
    await page.fill('#first_name', 'John');
    await page.fill('#last_name', 'Doe');
    await page.fill('#email', 'john.doe@example.com');
    await page.fill('#phone', '01234567890');

    // Use manual address entry
    await page.click('text=Enter Address Manually');
    await page.fill('#address', '123 Test Street\nTest City\nTE1 2ST');

    // Proceed to next step
    await page.click('text=Next');
    await expect(page.locator('h2')).toContainText('Add Windows');

    // Add a window
    await page.selectOption('#room', 'Living Room');
    await page.selectOption('#window_type', 'Casement');
    await page.fill('#width', '1200');
    await page.fill('#height', '1000');
    await page.fill('#quantity', '2');

    // Add window to estimate
    await page.click('text=Add Window');
    
    // Verify window was added
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('Living Room');
    await expect(page.locator('tbody tr')).toContainText('Casement');

    // Proceed to review
    await page.click('text=Next');
    await expect(page.locator('h2')).toContainText('Review & Generate');

    // Generate estimate
    await page.click('text=Generate Estimate');
    
    // Should redirect to estimate view
    await page.waitForURL(/\/estimates\/[^\/]+$/);
    await expect(page.locator('h1')).toContainText('Estimate');
  });

  test('should view existing estimates', async ({ page }) => {
    await page.goto('/estimates');
    await expect(page.locator('h1')).toContainText('Estimates');

    // Check if estimates list loads
    await page.waitForSelector('table, .empty-state', { timeout: 10000 });
    
    // If there are estimates, test viewing one
    const estimateRows = await page.locator('tbody tr').count();
    if (estimateRows > 0) {
      await page.click('tbody tr:first-child .view-button');
      await page.waitForURL(/\/estimates\/[^\/]+$/);
      await expect(page.locator('h1')).toContainText('Estimate');
    }
  });

  test('should edit an existing estimate', async ({ page }) => {
    // First create an estimate
    await page.goto('/estimates/create');
    
    // Quick estimate creation
    await page.fill('#first_name', 'Edit');
    await page.fill('#last_name', 'Test');
    await page.fill('#email', 'edit@test.com');
    await page.fill('#phone', '01234567890');
    await page.click('text=Enter Address Manually');
    await page.fill('#address', '456 Edit Street\nEdit City\nED1 2IT');
    await page.click('text=Next');
    
    // Add window
    await page.selectOption('#room', 'Kitchen');
    await page.selectOption('#window_type', 'Tilt & Turn');
    await page.fill('#width', '800');
    await page.fill('#height', '1200');
    await page.fill('#quantity', '1');
    await page.click('text=Add Window');
    await page.click('text=Next');
    await page.click('text=Generate Estimate');
    
    // Now edit the estimate
    await page.waitForURL(/\/estimates\/[^\/]+$/);
    await page.click('text=Edit');
    
    // Should load the wizard with existing data
    await expect(page.locator('#first_name')).toHaveValue('Edit');
    await expect(page.locator('#last_name')).toHaveValue('Test');
    
    // Modify customer name
    await page.fill('#first_name', 'Modified');
    await page.click('text=Next');
    
    // Should show existing window
    await expect(page.locator('tbody tr')).toContainText('Kitchen');
    
    // Add another window
    await page.selectOption('#room', 'Bedroom');
    await page.selectOption('#window_type', 'Fixed');
    await page.fill('#width', '600');
    await page.fill('#height', '800');
    await page.fill('#quantity', '1');
    await page.click('text=Add Window');
    
    // Should now have 2 windows
    await expect(page.locator('tbody tr')).toHaveCount(2);
    
    // Save changes
    await page.click('text=Next');
    await page.click('text=Update Estimate');
    
    // Verify changes were saved
    await page.waitForURL(/\/estimates\/[^\/]+$/);
    await expect(page.locator('text=Modified Test')).toBeVisible();
  });

  test('should delete an estimate', async ({ page }) => {
    // Go to estimates list
    await page.goto('/estimates');
    
    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    
    if (initialCount > 0) {
      // Delete first estimate
      await page.click('tbody tr:first-child .delete-button');
      
      // Confirm deletion
      page.on('dialog', dialog => dialog.accept());
      
      // Wait for deletion to complete
      await page.waitForTimeout(2000);
      
      // Check count decreased
      const newCount = await page.locator('tbody tr').count();
      expect(newCount).toBe(initialCount - 1);
    }
  });

  test('should generate PDF for estimate', async ({ page }) => {
    // Create a quick estimate first
    await page.goto('/estimates/create');
    await page.fill('#first_name', 'PDF');
    await page.fill('#last_name', 'Test');
    await page.fill('#email', 'pdf@test.com');
    await page.fill('#phone', '01234567890');
    await page.click('text=Enter Address Manually');
    await page.fill('#address', '789 PDF Street\nPDF City\nPD1 2F3');
    await page.click('text=Next');
    
    await page.selectOption('#room', 'Office');
    await page.selectOption('#window_type', 'Sliding');
    await page.fill('#width', '1500');
    await page.fill('#height', '1200');
    await page.fill('#quantity', '1');
    await page.click('text=Add Window');
    await page.click('text=Next');
    await page.click('text=Generate Estimate');
    
    // Now test PDF generation
    await page.waitForURL(/\/estimates\/[^\/]+$/);
    
    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Download PDF');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should handle estimate validation errors', async ({ page }) => {
    await page.goto('/estimates/create');
    
    // Try to proceed without filling required fields
    await page.click('text=Next');
    
    // Should show validation errors
    await expect(page.locator('.error, .invalid-feedback')).toBeVisible();
    
    // Fill minimum required fields
    await page.fill('#first_name', 'Valid');
    await page.fill('#last_name', 'User');
    await page.click('text=Next');
    
    // Should proceed to next step
    await expect(page.locator('h2')).toContainText('Add Windows');
    
    // Try to proceed without adding windows
    await page.click('text=Next');
    
    // Should show error about no windows
    await expect(page.locator('text=at least one window')).toBeVisible();
  });

  test('should save estimate progress locally', async ({ page, context }) => {
    await page.goto('/estimates/create');
    
    // Fill some data
    await page.fill('#first_name', 'Progress');
    await page.fill('#last_name', 'Test');
    await page.fill('#email', 'progress@test.com');
    
    // Go offline
    await context.setOffline(true);
    
    // Continue filling data
    await page.fill('#phone', '01234567890');
    await page.click('text=Enter Address Manually');
    await page.fill('#address', '123 Progress Street');
    
    // Data should be saved locally even offline
    await page.reload();
    
    // Data should persist
    await expect(page.locator('#first_name')).toHaveValue('Progress');
    await expect(page.locator('#last_name')).toHaveValue('Test');
    await expect(page.locator('#email')).toHaveValue('progress@test.com');
    
    // Go back online
    await context.setOffline(false);
  });
});
