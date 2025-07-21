const { chromium } = require('playwright');

async function testDebugOfflineCreate() {
  console.log('Testing offline estimate creation with debugging...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for ALL console messages to see debugging
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    console.log('1. Loading application...');
    await page.goto('http://localhost:8888/login');
    await page.waitForTimeout(3000);
    
    // Login
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('text=Log in');
    await page.waitForTimeout(3000);
    
    // Navigate to estimates page
    await page.goto('http://localhost:8888/estimates');
    await page.waitForTimeout(3000);
    
    console.log('2. Testing create button while online...');
    
    // Test clicking the create button while online
    const createButton = await page.locator('button:has-text("Create New Estimate")');
    if (await createButton.count() > 0) {
      console.log('Found create button, clicking...');
      await createButton.click();
      await page.waitForTimeout(3000);
      
      // Check what happened
      const modalVisible = await page.locator('text=Create New Estimate (Offline)').count() > 0;
      console.log('Modal visible after online click:', modalVisible);
      
      if (modalVisible) {
        // Close modal
        const closeButton = await page.locator('button').filter({ hasText: /×/ }).first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    console.log('3. Going offline...');
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    console.log('4. Testing create button while offline...');
    
    // Test clicking the create button while offline
    const createButtonOffline = await page.locator('button:has-text("Create New Estimate")');
    if (await createButtonOffline.count() > 0) {
      console.log('Found create button offline, clicking...');
      await createButtonOffline.click();
      await page.waitForTimeout(5000); // Wait longer to see what happens
      
      // Check what happened
      const modalVisibleOffline = await page.locator('text=Create New Estimate (Offline)').count() > 0;
      console.log('Modal visible after offline click:', modalVisibleOffline);
      
      // Check if there are any error messages or alerts
      const errorVisible = await page.locator('text=Network Error').count() > 0;
      console.log('Network error visible:', errorVisible);
      
      // Check current URL
      const currentUrl = page.url();
      console.log('Current URL after offline click:', currentUrl);
    }
    
    console.log('5. Checking browser network status...');
    const networkStatus = await page.evaluate(() => {
      return {
        onLine: navigator.onLine,
        userAgent: navigator.userAgent,
        location: window.location.href
      };
    });
    console.log('Network status:', networkStatus);
    
  } catch (error) {
    console.error('Error during debug test:', error);
  } finally {
    await browser.close();
  }
}

testDebugOfflineCreate();
