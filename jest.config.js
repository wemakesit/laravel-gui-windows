export default {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/js/setup.js'],

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/js/**/*.test.js',
    '<rootDir>/tests/js/**/*.spec.js'
  ],

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Module name mapping for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/resources/js/$1',
    '^@components/(.*)$': '<rootDir>/resources/js/Components/$1',
    '^@services/(.*)$': '<rootDir>/resources/js/Services/$1',
    '^@hooks/(.*)$': '<rootDir>/resources/js/Hooks/$1',
  },

  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'resources/js/**/*.{js,jsx,ts,tsx}',
    '!resources/js/**/*.d.ts',
    '!resources/js/ziggy.js',
    '!resources/js/bootstrap.js',
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/vendor/',
    '<rootDir>/storage/',
    '<rootDir>/bootstrap/cache/',
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 10000,
};
