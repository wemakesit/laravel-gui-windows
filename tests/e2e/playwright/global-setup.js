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
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('text=Log in');

    // Wait for login to complete - it might redirect to root first
    try {
      await page.waitForURL('**/dashboard', { timeout: 5000 });
    } catch {
      // If not redirected to dashboard, navigate there manually
      console.log(
        "⚠️  Login didn't redirect to dashboard, navigating manually..."
      );
      await page.goto('http://localhost:8888/dashboard');
      await page.waitForSelector('h2', { timeout: 5000 });
    }

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

    // Create a test user session that will be available for all tests
    await page.goto('http://localhost:8888/dashboard');
    await page.waitForSelector('h2', { timeout: 5000 });

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
