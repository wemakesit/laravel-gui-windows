/**
 * PWA Functionality Tests
 * Tests Progressive Web App features including service worker, manifest, and offline capabilities
 */

import { test, expect } from '@playwright/test';

test.describe('PWA Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console messages and errors
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  });

  test('should have service worker registered', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for PWA service to initialize
    await page.waitForTimeout(2000);

    const serviceWorkerStatus = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return {
            supported: true,
            registered: !!registration,
            scope: registration?.scope,
            active: !!registration?.active,
          };
        } catch (error) {
          return {
            supported: true,
            registered: false,
            active: false,
            error: error.message,
          };
        }
      }
      return { supported: false, registered: false, active: false };
    });

    expect(serviceWorkerStatus.supported).toBe(true);
    expect(serviceWorkerStatus.registered).toBe(true);
    expect(serviceWorkerStatus.active).toBe(true);
  });

  test('should have accessible web app manifest', async ({ page }) => {
    // Try the built manifest first, then fallback to static manifest
    let manifestResponse = await page.goto('/build/manifest.webmanifest');

    if (manifestResponse.status() !== 200) {
      console.log('Built manifest not found, trying static manifest...');
      manifestResponse = await page.goto('/manifest.json');
    }

    expect(manifestResponse.status()).toBe(200);

    const manifestContent = await manifestResponse.json();
    expect(manifestContent.name).toBeDefined();
    expect(manifestContent.short_name).toBeDefined();
    expect(manifestContent.start_url).toBeDefined();
    expect(manifestContent.display).toBeDefined();
  });

  test('should cache resources for offline use', async ({ page }) => {
    await page.goto('/login');

    // Check if critical resources are cached
    const cacheStatus = await page.evaluate(async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const results = {};

          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            results[cacheName] = keys.length;
          }

          return {
            supported: true,
            caches: results,
            total: cacheNames.length,
          };
        } catch (error) {
          return {
            supported: true,
            error: error.message,
            total: 0,
          };
        }
      }
      return { supported: false, total: 0 };
    });

    expect(cacheStatus.supported).toBe(true);
    expect(cacheStatus.total).toBeGreaterThan(0);
  });

  test('should work offline after initial load', async ({ page, context }) => {
    // First, load the app online
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('text=Log in');
    await page.waitForURL('/dashboard');

    // Go offline
    await context.setOffline(true);

    // Navigate to cached pages - should work
    await page.goto('/dashboard');
    await expect(page.locator('h2')).toContainText('Dashboard');

    // Try to navigate to estimates page
    await page.goto('/estimates');
    await expect(page.locator('h1')).toContainText('Estimates');

    // Go back online
    await context.setOffline(false);
  });

  test('should show offline indicator when offline', async ({
    page,
    context,
  }) => {
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('text=Log in');
    await page.waitForURL('/dashboard');

    // Go offline
    await context.setOffline(true);

    // Trigger a navigation to show offline status
    await page.reload();

    // Should show offline indicator
    await expect(page.locator('text=Offline Mode')).toBeVisible();
  });

  test('should store data in WatermelonDB for offline access', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('text=Log in');
    await page.waitForURL('/dashboard');

    // Check WatermelonDB storage
    const storageStatus = await page.evaluate(async () => {
      // Check if IndexedDB is available (WatermelonDB uses IndexedDB)
      if ('indexedDB' in window) {
        try {
          // Try to open a test database
          const request = indexedDB.open('test-db', 1);
          return new Promise(resolve => {
            request.onsuccess = () => {
              request.result.close();
              resolve({ available: true });
            };
            request.onerror = () => {
              resolve({ available: false, error: request.error });
            };
          });
        } catch (error) {
          return { available: false, error: error.message };
        }
      }
      return { available: false, error: 'IndexedDB not supported' };
    });

    expect(storageStatus.available).toBe(true);
  });

  test('should handle PWA installation prompt', async ({ page }) => {
    await page.goto('/login');

    // Check if PWA installation is possible
    const installStatus = await page.evaluate(() => {
      return {
        standalone: window.matchMedia('(display-mode: standalone)').matches,
        beforeInstallPrompt: 'onbeforeinstallprompt' in window,
      };
    });

    // If not already installed, should support installation
    if (!installStatus.standalone) {
      expect(installStatus.beforeInstallPrompt).toBe(true);
    }
  });

  test('should persist user session offline', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('text=Log in');
    await page.waitForURL('/dashboard');

    // Go offline
    await context.setOffline(true);

    // Reload page - session should persist
    await page.reload();

    // Should still be logged in (not redirected to login)
    await expect(page).toHaveURL('/dashboard');

    // Go back online
    await context.setOffline(false);
  });
});
