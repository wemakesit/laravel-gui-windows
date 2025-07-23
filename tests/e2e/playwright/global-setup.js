/**
 * Playwright Global Setup
 * Runs before all tests to prepare the testing environment
 */

import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🚀 Setting up test environment...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto('http://localhost:8888/login', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // Verify the application is working
    await page.waitForSelector('#email', { timeout: 10000 });
    console.log('✅ Application is ready');

    // Clear any existing test data
    console.log('🧹 Clearing existing test data...');

    // Fill login form
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');

    // Submit the form by clicking the "Log in" button and wait for navigation
    console.log('🔐 Submitting login form...');

    // Use Promise.all to wait for both the click and the navigation
    await Promise.all([
      page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 }),
      page.click('text=Log in'),
    ]);

    console.log('✅ Login form submitted, current URL:', page.url());

    // Check if we're redirected properly
    if (page.url().includes('/login')) {
      // Still on login page, check for errors
      const errorElements = await page.$$('.text-red-600, .error, [role="alert"]');
      if (errorElements.length > 0) {
        const errorText = await errorElements[0].textContent();
        console.log('❌ Login error:', errorText);
        throw new Error(`Login failed: ${errorText}`);
      } else {
        console.log('❌ Login failed: Still on login page but no visible errors');
        throw new Error('Login failed: No redirect occurred');
      }
    }

    // If we get here, login was successful
    console.log('✅ Login successful, current URL:', page.url());

    // Ensure we're on the dashboard (we should be after successful login)
    if (!page.url().includes('/dashboard')) {
      console.log('⚠️  Not on dashboard, navigating there...');
      await page.goto('http://localhost:8888/dashboard');
      await page.waitForLoadState('networkidle');
    }

    // Verify we can see the dashboard content
    await page.waitForSelector('h1, h2, [data-testid="dashboard"]', { timeout: 5000 });
    console.log('✅ Dashboard loaded successfully');

    // Clear WatermelonDB data if the clear function exists
    try {
      await page.goto('http://localhost:8888/sync-test');
      await page.waitForSelector('text=Clear All Data', { timeout: 5000 });

      // Accept any confirmation dialogs
      page.on('dialog', dialog => dialog.accept());
      await page.click('text=Clear All Data');
      await page.waitForTimeout(2000);

      console.log('✅ Test data cleared');
    } catch (error) {
      console.log('⚠️  Could not clear test data:', error.message);
    }

    // Seed some basic test data if needed
    console.log('🌱 Seeding basic test data...');

    // Save authentication state for reuse in tests
    await context.storageState({ path: 'tests/e2e/playwright/.auth/user.json' });

    // We're already on the dashboard and logged in, so we're ready for tests
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
