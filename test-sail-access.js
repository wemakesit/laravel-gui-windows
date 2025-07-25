const { chromium } = require('playwright');

async function testSailAccess() {
  console.log('🧪 Testing Sail application access...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', error => console.log('Page error:', error.message));
  page.on('requestfailed', request => console.log('Request failed:', request.url(), request.failure().errorText));
  
  try {
    console.log('📍 Attempting to navigate to http://localhost:8888...');
    
    // Try to navigate to the application
    const response = await page.goto('http://localhost:8888', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ Navigation successful!');
    console.log('📊 Response status:', response.status());
    console.log('🌐 Final URL:', page.url());
    console.log('📄 Page title:', await page.title());
    
    // Take a screenshot
    await page.screenshot({ path: 'sail-access-test.png', fullPage: true });
    console.log('📸 Screenshot saved as sail-access-test.png');
    
    // Check if we can see the login form
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('✅ Login form found on page');
    } else {
      console.log('❌ No login form found');
    }
    
    // Get page content snippet
    const bodyText = await page.textContent('body');
    console.log('📝 Page content (first 200 chars):', bodyText.substring(0, 200));
    
    // Wait a bit to see the page
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Error accessing application:', error.message);
    
    // Try alternative URLs
    console.log('🔄 Trying alternative URLs...');
    
    try {
      console.log('📍 Trying http://127.0.0.1:8888...');
      await page.goto('http://127.0.0.1:8888', { timeout: 10000 });
      console.log('✅ 127.0.0.1:8888 works!');
      console.log('🌐 Final URL:', page.url());
      await page.screenshot({ path: 'sail-access-127.png' });
    } catch (e) {
      console.error('❌ 127.0.0.1:8888 failed:', e.message);
    }
    
    try {
      console.log('📍 Trying http://192.168.0.22:8888...');
      await page.goto('http://192.168.0.22:8888', { timeout: 10000 });
      console.log('✅ 192.168.0.22:8888 works!');
      console.log('🌐 Final URL:', page.url());
      await page.screenshot({ path: 'sail-access-ip.png' });
    } catch (e) {
      console.error('❌ 192.168.0.22:8888 failed:', e.message);
    }
  }
  
  await browser.close();
  console.log('🏁 Test completed');
}

testSailAccess().catch(console.error);
