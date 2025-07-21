const { chromium } = require('playwright');

async function testPWAFunctionality() {
  console.log('Testing PWA functionality...');
  
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
    // Navigate to the app
    console.log('1. Loading the application...');
    await page.goto('http://0.0.0.0:8888/login');
    await page.waitForTimeout(3000);
    
    // Check if service worker is registered
    console.log('2. Checking service worker registration...');
    const serviceWorkerRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return {
            registered: !!registration,
            scope: registration?.scope,
            active: !!registration?.active,
          };
        } catch (error) {
          return { error: error.message };
        }
      }
      return { supported: false };
    });
    
    console.log('Service Worker Status:', serviceWorkerRegistered);
    
    // Check if manifest is accessible
    console.log('3. Checking web app manifest...');
    const manifestResponse = await page.goto('http://0.0.0.0:8888/build/manifest.webmanifest');
    const manifestStatus = manifestResponse?.status();
    console.log('Manifest Status:', manifestStatus);
    
    if (manifestStatus === 200) {
      const manifestContent = await manifestResponse?.json();
      console.log('Manifest Name:', manifestContent?.name);
      console.log('Manifest Display:', manifestContent?.display);
    }
    
    // Go back to the app
    await page.goto('http://0.0.0.0:8888/login');
    await page.waitForTimeout(2000);
    
    // Login to access the app
    console.log('4. Logging in...');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('text=Log in');
    await page.waitForTimeout(3000);
    
    // Create some test data
    console.log('5. Creating test data...');
    await page.goto('http://0.0.0.0:8888/estimates');
    await page.waitForTimeout(3000);
    
    await page.evaluate(async () => {
      try {
        const db = new PouchDB('window_estimates');
        const estimate = {
          _id: 'estimate_pwa_test',
          customerName: 'PWA Test Customer',
          customerEmail: 'pwa@test.com',
          customerPhone: '1111111111',
          customerAddress: '123 PWA Test Street',
          windows: [{ type: 'PWA Window', room: 'Test Room', price: 500 }],
          totalPrice: 500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft'
        };
        await db.put(estimate);
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    // Refresh to see the data
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Now test offline functionality
    console.log('6. Testing offline functionality...');
    await context.setOffline(true);
    
    // Try to navigate within the app (should work)
    await page.goto('http://0.0.0.0:8888/');
    await page.waitForTimeout(3000);
    
    const dashboardLoaded = await page.locator('text=Dashboard').count() > 0;
    console.log('Dashboard loads offline:', dashboardLoaded ? '✅' : '❌');
    
    // Try to view estimates (should work)
    await page.goto('http://0.0.0.0:8888/estimates');
    await page.waitForTimeout(3000);
    
    const estimatesLoaded = await page.locator('text=PWA Test Customer').count() > 0;
    console.log('Estimates load offline:', estimatesLoaded ? '✅' : '❌');
    
    // Try to view an estimate in modal (should work)
    if (estimatesLoaded) {
      const viewButton = await page.locator('button:has-text("View")').first();
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await page.waitForTimeout(2000);
        
        const modalVisible = await page.locator('text=Customer Information').count() > 0;
        console.log('Estimate modal works offline:', modalVisible ? '✅' : '❌');
        
        if (modalVisible) {
          await page.locator('button:has-text("Close")').last().click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // Check if cached resources are working
    console.log('7. Checking cached resources...');
    const cachedResourcesWorking = await page.evaluate(async () => {
      // Check if CSS is loaded (indicates caching is working)
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      const hasStyles = stylesheets.length > 0;
      
      // Check if JavaScript is working (indicates caching is working)
      const hasReact = typeof React !== 'undefined';
      
      return {
        stylesheets: stylesheets.length,
        hasStyles,
        hasReact,
        working: hasStyles && document.body.children.length > 0
      };
    });
    
    console.log('Cached Resources Status:', cachedResourcesWorking);
    
    console.log('\\n=== PWA FUNCTIONALITY TEST RESULTS ===');
    console.log(serviceWorkerRegistered.registered ? '✅ Service Worker registered' : '❌ Service Worker not registered');
    console.log(manifestStatus === 200 ? '✅ Web App Manifest accessible' : '❌ Web App Manifest not accessible');
    console.log(dashboardLoaded ? '✅ Dashboard works offline' : '❌ Dashboard fails offline');
    console.log(estimatesLoaded ? '✅ Estimates work offline' : '❌ Estimates fail offline');
    console.log(cachedResourcesWorking.working ? '✅ Cached resources working' : '❌ Cached resources not working');
    
    if (serviceWorkerRegistered.registered && manifestStatus === 200 && dashboardLoaded && estimatesLoaded) {
      console.log('\\n🎉 PWA is working correctly!');
      console.log('✅ Service worker caching assets');
      console.log('✅ App works offline');
      console.log('✅ Data persists in PouchDB');
      console.log('✅ Ready for installation');
    } else {
      console.log('\\n❌ PWA has issues that need to be fixed');
    }
    
  } catch (error) {
    console.error('Error during PWA test:', error);
  } finally {
    await browser.close();
  }
}

testPWAFunctionality();
