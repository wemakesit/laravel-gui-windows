const { chromium } = require('playwright');

async function testManualPouchDB() {
  console.log('Testing manual PouchDB data insertion...');
  
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
    
    // Navigate to any page to ensure PouchDB is loaded
    await page.goto('http://0.0.0.0:8888/estimates');
    await page.waitForTimeout(3000);
    
    // Manually insert data into PouchDB
    console.log('2. Manually inserting test data into PouchDB...');
    const insertResult = await page.evaluate(async () => {
      try {
        const db = new PouchDB('window_estimates');
        
        // Create a test estimate
        const testEstimate = {
          _id: `estimate_${Date.now()}_test`,
          customerName: 'Manual Test Customer',
          customerEmail: 'manual@test.com',
          customerPhone: '1234567890',
          customerAddress: '123 Manual Test Street',
          windows: [
            {
              type: 'Test Window',
              room: 'Test Room',
              price: 500
            }
          ],
          totalPrice: 500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft'
        };
        
        const result = await db.put(testEstimate);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('Insert result:', insertResult);
    
    // Check if data was saved
    console.log('3. Checking PouchDB data...');
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
    
    console.log('PouchDB data after insert:', JSON.stringify(estimatesData, null, 2));
    
    // Refresh the estimates page to see if it loads the data
    console.log('4. Refreshing estimates page...');
    await page.reload();
    await page.waitForTimeout(5000);
    
    const estimateRows = await page.locator('tbody tr').count();
    console.log(`Estimates displayed: ${estimateRows}`);
    
    if (estimateRows > 0) {
      console.log('✅ SUCCESS: Manual PouchDB data is being displayed!');
      
      // Get the first row details
      const firstRow = await page.locator('tbody tr').first();
      const customerName = await firstRow.locator('td').nth(1).textContent();
      const windowCount = await firstRow.locator('td').nth(2).textContent();
      const totalAmount = await firstRow.locator('td').nth(3).textContent();
      
      console.log(`First estimate: ${customerName}, ${windowCount} windows, ${totalAmount}`);
    } else {
      console.log('❌ ISSUE: Manual PouchDB data is not being displayed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testManualPouchDB();
