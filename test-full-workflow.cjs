const { chromium } = require('playwright');

async function testFullWorkflow() {
  console.log('Testing full estimate workflow...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    // Login
    console.log('1. Logging in...');
    await page.goto('http://0.0.0.0:8888/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('text=Log in');
    await page.waitForTimeout(3000);
    
    // Check initial estimates list (should be empty)
    console.log('2. Checking initial estimates list...');
    await page.goto('http://0.0.0.0:8888/estimates');
    await page.waitForTimeout(5000);
    
    let estimateRows = await page.locator('tbody tr').count();
    console.log(`Initial estimates count: ${estimateRows}`);
    
    // Create a new estimate using the simplified approach
    console.log('3. Creating new estimate...');
    await page.goto('http://0.0.0.0:8888/estimates/create');
    await page.waitForTimeout(3000);
    
    // Fill basic customer info
    await page.fill('#first_name', 'Test');
    await page.fill('#last_name', 'Customer');
    await page.fill('#email', 'test@customer.com');
    await page.fill('#phone', '1234567890');
    
    // Use manual address entry
    await page.click('text=Enter Address Manually');
    await page.waitForTimeout(1000);
    await page.fill('#address', '123 Test Street\\nTest City\\nTE1 2ST');
    
    // Go to next step (windows)
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    
    // Add a window - try to find the actual button
    const addWindowButton = await page.locator('button').filter({ hasText: /add.*window/i }).first();
    if (await addWindowButton.count() > 0) {
      await addWindowButton.click();
      await page.waitForTimeout(2000);
      
      // Try to fill window details - look for any select or input fields
      const selects = await page.locator('select').count();
      const inputs = await page.locator('input[type="text"]').count();
      console.log(`Found ${selects} select fields and ${inputs} text inputs`);
      
      // Fill whatever fields we can find
      if (selects > 0) {
        await page.selectOption('select', { index: 1 });
      }
      
      // Look for room field
      const roomInput = await page.locator('input').filter({ hasText: /room/i }).first();
      if (await roomInput.count() > 0) {
        await roomInput.fill('Living Room');
      }
      
      // Try to save the window
      const saveButton = await page.locator('button').filter({ hasText: /save/i }).first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Continue to next step
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    
    // Skip extras
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    
    // Generate estimate
    const generateButton = await page.locator('button').filter({ hasText: /generate/i }).first();
    if (await generateButton.count() > 0) {
      await generateButton.click();
      await page.waitForTimeout(5000);
      console.log('4. Estimate generation attempted...');
    }
    
    // Check PouchDB data directly
    console.log('5. Checking PouchDB data...');
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
    
    // Navigate back to estimates list
    console.log('6. Checking estimates list after creation...');
    await page.goto('http://0.0.0.0:8888/estimates');
    await page.waitForTimeout(5000);
    
    estimateRows = await page.locator('tbody tr').count();
    console.log(`Final estimates count: ${estimateRows}`);
    
    if (estimateRows > 0) {
      console.log('✅ SUCCESS: Estimates are being displayed!');
    } else {
      console.log('❌ ISSUE: No estimates found in the list');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testFullWorkflow();
