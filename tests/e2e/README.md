# End-to-End Tests

This directory contains end-to-end tests for the Laravel GUI Windows application using Playwright.

## 📁 Test Structure

```
tests/e2e/
├── playwright/
│   ├── pwa-functionality.spec.js      # PWA features (service worker, manifest, offline)
│   ├── estimate-workflow.spec.js      # Complete estimate creation and management
│   ├── watermelondb-storage.spec.js   # Offline-first data storage tests
│   ├── global-setup.js               # Global test setup
│   └── global-teardown.js            # Global test cleanup
├── README.md                         # This file
└── playwright.config.js             # Playwright configuration
```

## 🧪 Test Categories

### **PWA Functionality Tests** (`pwa-functionality.spec.js`)
- Service worker registration and functionality
- Web app manifest accessibility
- Resource caching for offline use
- Offline navigation and functionality
- PWA installation capabilities
- Session persistence offline

### **Estimate Workflow Tests** (`estimate-workflow.spec.js`)
- Complete estimate creation process
- Viewing and editing existing estimates
- Estimate deletion
- PDF generation
- Form validation
- Progress saving during offline mode

### **WatermelonDB Storage Tests** (`watermelondb-storage.spec.js`)
- Data storage in WatermelonDB/IndexedDB
- Offline data loading and persistence
- Data synchronization when coming online
- Storage statistics and management
- Data clearing functionality
- Concurrent operations handling
- Data integrity across page reloads

## 🚀 Running Tests

### **Prerequisites**
```bash
# Install Playwright
npm install @playwright/test

# Install browsers
npx playwright install
```

### **Basic Commands**
```bash
# Run all E2E tests
npm run test:e2e

# Run tests with browser UI visible
npm run test:e2e:headed

# Debug tests interactively
npm run test:e2e:debug

# Run tests with Playwright UI
npm run test:e2e:ui

# View test report
npm run test:e2e:report
```

### **Specific Test Suites**
```bash
# Run only PWA tests
npx playwright test pwa-functionality

# Run only estimate workflow tests
npx playwright test estimate-workflow

# Run only storage tests
npx playwright test watermelondb-storage
```

### **Browser-Specific Testing**
```bash
# Test on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Test on mobile devices
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"

# Test on Surface Pro (touch interface)
npx playwright test --project="Surface Pro"
```

## 🔧 Configuration

### **Test Environment**
- **Base URL**: `http://localhost:8888`
- **Test User**: `test@example.com` / `password`
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Parallel**: Yes (except on CI)

### **Browser Support**
- ✅ **Desktop**: Chrome, Firefox, Safari
- ✅ **Mobile**: Chrome (Pixel 5), Safari (iPhone 12)
- ✅ **Touch**: Surface Pro simulation

### **Artifacts**
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry
- **Reports**: HTML, JSON, JUnit formats

## 🛠️ Test Development

### **Writing New Tests**
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup for each test
    await page.goto('/login');
    // ... login logic
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await page.goto('/some-page');
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```

### **Best Practices**
1. **Use descriptive test names** that explain the expected behavior
2. **Group related tests** in describe blocks
3. **Set up common state** in beforeEach hooks
4. **Use proper selectors** (prefer data-testid, text content, or semantic selectors)
5. **Wait for elements** instead of using fixed timeouts
6. **Test offline scenarios** for PWA functionality
7. **Clean up test data** in teardown

### **Debugging Tests**
```bash
# Run with debug mode
npm run test:e2e:debug

# Run specific test with debug
npx playwright test estimate-workflow --debug

# Generate trace for failed test
npx playwright test --trace=on
```

## 📊 CI/CD Integration

### **GitHub Actions Example**
```yaml
- name: Run E2E Tests
  run: |
    npm run test:e2e
  env:
    CI: true

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: test-results/
```

### **Test Reports**
- **HTML Report**: Interactive report with screenshots and videos
- **JSON Report**: Machine-readable results for CI integration
- **JUnit Report**: Compatible with most CI systems

## 🔍 Troubleshooting

### **Common Issues**

**Tests timing out:**
```bash
# Increase timeout in playwright.config.js
timeout: 60000
```

**Application not starting:**
```bash
# Check if Laravel server is running
php artisan serve --host=0.0.0.0 --port=8888
```

**Browser not found:**
```bash
# Reinstall browsers
npx playwright install
```

**Test data conflicts:**
```bash
# Clear test data manually
# Visit /sync-test and click "Clear All Data"
```

### **Environment Variables**
```bash
# Run in CI mode
CI=true npm run test:e2e

# Custom base URL
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

## 📈 Test Coverage

The E2E tests cover:
- ✅ **User Authentication** - Login/logout flows
- ✅ **PWA Features** - Service worker, manifest, offline mode
- ✅ **Estimate Management** - CRUD operations
- ✅ **Offline Functionality** - Data persistence and sync
- ✅ **Form Validation** - Error handling and validation
- ✅ **File Operations** - PDF generation and downloads
- ✅ **Mobile Responsiveness** - Touch interface testing
- ✅ **Data Integrity** - WatermelonDB storage and retrieval

## 🎯 Future Enhancements

- **Visual regression testing** with screenshot comparison
- **Performance testing** with Lighthouse integration
- **Accessibility testing** with axe-core
- **API mocking** for isolated frontend testing
- **Cross-browser compatibility** matrix
- **Load testing** for concurrent users
