const { chromium } = require('playwright');

async function testEstimatePersistence() {
  console.log('Testing estimate persistence...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://0.0.0.0:8888/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('button:has-text("Log in")');
    await page.waitForTimeout(3000);
    
    // Create a simple estimate
    console.log('Creating estimate...');
    await page.goto('http://0.0.0.0:8888/estimates/create');
    await page.waitForTimeout(2000);
    
    // Fill customer info
    await page.fill('#first_name', 'Test');
    await page.fill('#last_name', 'Customer');
    await page.fill('#email', 'test@customer.com');
    await page.fill('#phone', '1234567890');
    
    // Use manual address
    await page.click('text=Enter Address Manually');
    await page.fill('#address', '123 Test Street\nTest City\nTE1 2ST');
    
    // Go to next step
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    
    // Add a window
    await page.click('button:has-text("Add Window")');
    await page.waitForTimeout(1000);
    
    // Fill window details
    await page.selectOption('select[name="window_type"]', { index: 1 });
    await page.fill('input[name="room"]', 'Living Room');
    await page.click('button:has-text("Save Window")');
    await page.waitForTimeout(1000);
    
    // Continue through wizard
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Skip extras
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // Generate estimate
    await page.click('button:has-text("Generate Estimate")');
    await page.waitForTimeout(3000);
    
    console.log('Estimate created, checking PouchDB data...');
    
    // Check PouchDB data
    const estimatesData = await page.evaluate(async () => {
      try {
        const db = new PouchDB('window_estimates');
        const result = await db.allDocs({ include_docs: true });
        return result.rows.map(row => ({
          id: row.doc._id,
          customerName: row.doc.customerName,
          totalPrice: row.doc.totalPrice,
          windows: row.doc.windows?.length || 0
        }));
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('PouchDB data:', JSON.stringify(estimatesData, null, 2));
    
    // Now navigate to estimates list
    console.log('Navigating to estimates list...');
    await page.goto('http://0.0.0.0:8888/estimates');
    await page.waitForTimeout(5000);
    
    // Check if estimates are displayed
    const estimateRows = await page.locator('tbody tr').count();
    console.log(`Found ${estimateRows} estimate(s) on the page`);
    
    if (estimateRows > 0) {
      console.log('✓ Estimates are being displayed correctly!');
    } else {
      console.log('❌ No estimates found on the page');
      
      // Check if there's a loading state
      const loadingText = await page.textContent('body');
      if (loadingText.includes('Loading')) {
        console.log('Page is still loading...');
        await page.waitForTimeout(5000);
        const newCount = await page.locator('tbody tr').count();
        console.log(`After waiting: Found ${newCount} estimate(s)`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testEstimatePersistence();
