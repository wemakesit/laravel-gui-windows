const { chromium } = require('playwright');

async function testEstimatesDisplay() {
  console.log('Testing estimates display...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto('http://0.0.0.0:8888/login');
    
    // Login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for login
    await page.waitForTimeout(3000);
    
    // Navigate to estimates page
    await page.goto('http://0.0.0.0:8888/estimates');
    
    // Wait for estimates to load
    await page.waitForTimeout(5000);
    
    // Check if estimates are displayed
    const estimateRows = await page.locator('tbody tr').count();
    console.log(`Found ${estimateRows} estimate(s) on the page`);
    
    if (estimateRows > 0) {
      console.log('✓ Estimates are being displayed correctly!');
      
      // Get details of first estimate
      const firstEstimate = await page.locator('tbody tr').first();
      const customerName = await firstEstimate.locator('td').nth(1).textContent();
      const windowCount = await firstEstimate.locator('td').nth(2).textContent();
      const totalAmount = await firstEstimate.locator('td').nth(3).textContent();
      
      console.log(`First estimate: ${customerName}, ${windowCount} windows, ${totalAmount}`);
    } else {
      console.log('❌ No estimates found on the page');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'estimates-page.png' });
    console.log('Screenshot saved as estimates-page.png');
    
  } catch (error) {
    console.error('Error testing estimates display:', error);
  } finally {
    await browser.close();
  }
}

testEstimatesDisplay();
