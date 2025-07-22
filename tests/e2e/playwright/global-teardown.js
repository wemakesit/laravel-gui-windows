/**
 * Playwright Global Teardown
 * Runs after all tests to clean up the testing environment
 */

const { chromium } = require('@playwright/test');

async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  // Launch browser for cleanup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login to access cleanup functions
    await page.goto('http://localhost:8888/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('text=Log in');
    await page.waitForURL('**/dashboard');
    
    // Clear all test data
    try {
      await page.goto('http://localhost:8888/sync-test');
      await page.waitForSelector('text=Clear All Data', { timeout: 5000 });
      
      // Accept any confirmation dialogs
      page.on('dialog', dialog => dialog.accept());
      await page.click('text=Clear All Data');
      await page.waitForTimeout(2000);
      
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.log('⚠️  Could not clean up test data:', error.message);
    }
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

module.exports = globalTeardown;
