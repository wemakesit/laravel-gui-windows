module.exports = {
  ci: {
    collect: {
      // URLs to test (adjust based on application routes)
      url: [
        'http://localhost:8000',
        'http://localhost:8000/estimates',
        'http://localhost:8000/estimates/create',
      ],
      startServerCommand: 'php artisan serve --port=8888 &',
      startServerReadyPattern: 'Development Server.*started',
      startServerReadyTimeout: 30000,
    },
    assert: {
      // Performance thresholds
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // PWA specific checks
        'installable-manifest': 'warn',
        'service-worker': 'warn',
        'works-offline': 'warn',
        
        // Security
        'is-on-https': 'off', // Disabled for local testing
        'uses-https': 'off',   // Disabled for local testing
        
        // Performance budgets
        'resource-summary:document:size': ['warn', { maxNumericValue: 50000 }],
        'resource-summary:script:size': ['warn', { maxNumericValue: 500000 }],
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 100000 }],
        'resource-summary:image:size': ['warn', { maxNumericValue: 1000000 }],
        'resource-summary:font:size': ['warn', { maxNumericValue: 200000 }],
        
        // Network requests
        'network-requests': ['warn', { maxNumericValue: 50 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'unused-javascript': ['warn', { maxNumericValue: 50000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
