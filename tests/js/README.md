# WatermelonDB Tests

This directory contains comprehensive tests for the WatermelonDB implementation in the Laravel GUI Windows application.

## 📁 Test Structure

```
tests/js/
├── Database/
│   ├── schema.test.js          # Database schema validation tests
│   ├── Customer.test.js        # Customer model tests
│   ├── Estimate.test.js        # Estimate model tests
│   ├── Window.test.js          # Window model tests
│   └── integration.test.js     # Integration and workflow tests
├── Services/
│   └── WatermelonDBService.test.js  # Service layer tests
├── Components/
│   └── (Future component tests)
├── setup.js                   # Jest test setup and mocks
└── README.md                  # This file
```

## 🧪 Test Categories

### **Database Schema Tests** (`Database/schema.test.js`)
- Validates database schema structure
- Tests table definitions and column types
- Verifies relationships and constraints
- Ensures proper indexing

### **Model Tests**
- **Customer Model** (`Database/Customer.test.js`)
  - CRUD operations
  - Relationship handling
  - Derived properties (fullAddress, displayName)
  - Validation rules

- **Estimate Model** (`Database/Estimate.test.js`)
  - Status management (draft, pending, approved, rejected)
  - Amount calculations
  - PDF generation tracking
  - Sync status handling

- **Window Model** (`Database/Window.test.js`)
  - Dimension calculations
  - Pricing updates
  - Configuration management
  - Options handling

### **Service Tests** (`Services/WatermelonDBService.test.js`)
- Database initialization
- CRUD operations for all entities
- Search and filtering functionality
- Storage statistics
- Error handling

### **Integration Tests** (`Database/integration.test.js`)
- Complete estimate workflows
- Data relationship integrity
- Cascade operations
- Performance testing
- Concurrent operations

## 🚀 Running Tests

### **Using npm scripts:**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# WatermelonDB-specific tests
npm run test:watermelondb
npm run test:watermelondb:watch
npm run test:watermelondb:coverage
```

### **Using the test runner script:**
```bash
# Run all WatermelonDB tests
node scripts/test-watermelondb.js run all

# Run specific test suites
node scripts/test-watermelondb.js run schema
node scripts/test-watermelondb.js run models
node scripts/test-watermelondb.js run service
node scripts/test-watermelondb.js run integration

# Watch mode
node scripts/test-watermelondb.js watch models

# Coverage
node scripts/test-watermelondb.js coverage all

# Help
node scripts/test-watermelondb.js help
```

### **Using Jest directly:**
```bash
# Run specific test files
npx jest tests/js/Database/Customer.test.js
npx jest tests/js/Services/WatermelonDBService.test.js

# Run with specific options
npx jest tests/js/Database --verbose
npx jest tests/js/Database --coverage --watch
```

## 🔧 Test Configuration

### **Jest Configuration** (`jest.config.js`)
- **Environment**: jsdom (for browser APIs)
- **Transform**: Babel with TypeScript and decorator support
- **Coverage**: 80% threshold for all metrics
- **Timeout**: 10 seconds per test
- **Setup**: Comprehensive mocking in `setup.js`

### **Babel Configuration**
- **Presets**: env, react, typescript
- **Plugins**: decorators (legacy), class-properties
- **Targets**: Current Node.js version

## 🎭 Mocking Strategy

### **WatermelonDB Mocks**
- Database instance with write/read operations
- Collection mocks with CRUD methods
- Query mocks with fetch/count operations
- Model mocks with relationships

### **Browser APIs**
- IndexedDB and IDBKeyRange
- localStorage and sessionStorage
- navigator.onLine
- crypto.randomUUID
- Performance API

### **Test Utilities**
Global utilities available in all tests:
```javascript
// Create mock data
const customer = watermelonTestUtils.createMockCustomer();
const estimate = watermelonTestUtils.createMockEstimate();
const window = watermelonTestUtils.createMockWindow();

// Create mock database components
const database = watermelonTestUtils.createMockDatabase();
const collection = watermelonTestUtils.createMockCollection();
const query = watermelonTestUtils.createMockQuery();
```

## 📊 Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Database Schema | 100% |
| Models | 90%+ |
| Service Layer | 85%+ |
| Integration | 80%+ |
| **Overall** | **80%+** |

## 🐛 Debugging Tests

### **Verbose Output**
```bash
npm run test:watermelondb -- --verbose
```

### **Debug Specific Test**
```bash
npx jest tests/js/Database/Customer.test.js --verbose --no-coverage
```

### **Console Logging**
Tests suppress console output by default. To see logs:
```javascript
// In test files
beforeEach(() => {
  global.restoreConsole(); // Restore console for debugging
});
```

## 📝 Writing New Tests

### **Test File Template**
```javascript
/**
 * [Component] Tests
 * Tests for [component description]
 */

// Mock setup
const mockComponent = {
  // Mock implementation
};

describe('[Component]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mocks
  });

  describe('[Feature Group]', () => {
    test('should [expected behavior]', async () => {
      // Arrange
      const input = {};
      
      // Act
      const result = await component.method(input);
      
      // Assert
      expect(result).toEqual(expected);
    });
  });
});
```

### **Best Practices**
1. **Arrange-Act-Assert** pattern
2. **Descriptive test names** that explain expected behavior
3. **Mock external dependencies** completely
4. **Test edge cases** and error conditions
5. **Use async/await** for promises
6. **Clean up** in beforeEach/afterEach
7. **Group related tests** in describe blocks

## 🔄 Continuous Integration

Tests are configured to run in CI with:
- **Coverage reporting** to ensure quality
- **Fail-fast** on first error
- **No watch mode** for CI environments
- **Deterministic results** with fixed seeds

```bash
npm run test:ci
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [WatermelonDB Testing Guide](https://watermelondb.dev/docs/Advanced/Testing)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Babel Configuration](https://babeljs.io/docs/en/configuration)
