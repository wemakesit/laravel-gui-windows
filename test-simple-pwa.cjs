const { chromium } = require('playwright');

async function testSimplePWA() {
  console.log('Testing simple PWA functionality...');
  
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
    await page.goto('http://localhost:8888/login');
    await page.waitForTimeout(5000);
    
    // Check service worker support
    const swSupport = await page.evaluate(() => {
      return {
        supported: 'serviceWorker' in navigator,
        userAgent: navigator.userAgent,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol
      };
    });
    
    console.log('Service Worker Support:', swSupport);
    
    // Try to manually register service worker
    const manualRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('Attempting manual service worker registration...');
          const registration = await navigator.serviceWorker.register('/build/sw.js');
          console.log('Manual registration successful:', registration);
          return {
            success: true,
            scope: registration.scope,
            active: !!registration.active,
            installing: !!registration.installing,
            waiting: !!registration.waiting
          };
        } catch (error) {
          console.error('Manual registration failed:', error);
          return { success: false, error: error.message };
        }
      }
      return { success: false, error: 'Service worker not supported' };
    });
    
    console.log('Manual Registration Result:', manualRegistration);
    
    // Wait a bit for service worker to activate
    await page.waitForTimeout(3000);
    
    // Check if service worker is now active
    const swStatus = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          hasRegistration: !!registration,
          active: !!registration?.active,
          scope: registration?.scope,
          state: registration?.active?.state
        };
      }
      return { hasRegistration: false };
    });
    
    console.log('Service Worker Status:', swStatus);
    
    // Check if manifest is accessible
    const manifestCheck = await page.evaluate(async () => {
      try {
        const response = await fetch('/build/manifest.webmanifest');
        const manifest = await response.json();
        return {
          accessible: response.ok,
          name: manifest.name,
          display: manifest.display
        };
      } catch (error) {
        return { accessible: false, error: error.message };
      }
    });
    
    console.log('Manifest Check:', manifestCheck);
    
    // Test if we can cache a simple request
    if (swStatus.active) {
      console.log('2. Testing caching functionality...');
      
      // Make a request that should be cached
      await page.evaluate(async () => {
        try {
          const response = await fetch('/build/manifest.json');
          console.log('Fetch response:', response.status, response.statusText);
          return response.ok;
        } catch (error) {
          console.error('Fetch error:', error);
          return false;
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Now test offline
      console.log('3. Testing offline functionality...');
      await context.setOffline(true);
      
      const offlineTest = await page.evaluate(async () => {
        try {
          const response = await fetch('/build/manifest.json');
          return {
            success: true,
            status: response.status,
            fromCache: response.headers.get('cache-control') !== null
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      console.log('Offline Test Result:', offlineTest);
      
      if (offlineTest.success) {
        console.log('✅ PWA caching is working!');
      } else {
        console.log('❌ PWA caching is not working');
      }
    } else {
      console.log('❌ Service worker not active, cannot test caching');
    }
    
    console.log('\\n=== PWA TEST SUMMARY ===');
    console.log('Service Worker Supported:', swSupport.supported ? '✅' : '❌');
    console.log('Service Worker Registered:', manualRegistration.success ? '✅' : '❌');
    console.log('Service Worker Active:', swStatus.active ? '✅' : '❌');
    console.log('Manifest Accessible:', manifestCheck.accessible ? '✅' : '❌');
    
  } catch (error) {
    console.error('Error during PWA test:', error);
  } finally {
    await browser.close();
  }
}

testSimplePWA();
