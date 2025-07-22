#!/usr/bin/env node

/**
 * WatermelonDB Test Runner
 * Convenient script to run WatermelonDB-specific tests
 */

const { spawn } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'run';

// Test configurations
const testConfigs = {
  // Run all WatermelonDB tests
  all: {
    patterns: ['tests/js/Database', 'tests/js/Services/WatermelonDBService.test.js'],
    description: 'Run all WatermelonDB tests',
  },
  
  // Run only schema tests
  schema: {
    patterns: ['tests/js/Database/schema.test.js'],
    description: 'Run database schema tests',
  },
  
  // Run only model tests
  models: {
    patterns: ['tests/js/Database/Customer.test.js', 'tests/js/Database/Estimate.test.js', 'tests/js/Database/Window.test.js'],
    description: 'Run model tests',
  },
  
  // Run only service tests
  service: {
    patterns: ['tests/js/Services/WatermelonDBService.test.js'],
    description: 'Run WatermelonDBService tests',
  },
  
  // Run integration tests
  integration: {
    patterns: ['tests/js/Database/integration.test.js'],
    description: 'Run integration tests',
  },
};

// Helper functions
function showHelp() {
  console.log(`
WatermelonDB Test Runner

Usage:
  node scripts/test-watermelondb.js [command] [options]

Commands:
  run [suite]     Run tests (default: all)
  watch [suite]   Run tests in watch mode
  coverage [suite] Run tests with coverage
  help            Show this help

Test Suites:
${Object.entries(testConfigs).map(([name, config]) => 
  `  ${name.padEnd(12)} ${config.description}`
).join('\n')}

Options:
  --verbose       Verbose output
  --silent        Silent output
  --bail          Stop on first failure

Examples:
  node scripts/test-watermelondb.js run all
  node scripts/test-watermelondb.js watch models
  node scripts/test-watermelondb.js coverage service
`);
}

function runJest(patterns, options = {}) {
  const jestArgs = [
    ...patterns,
    ...(options.watch ? ['--watch'] : []),
    ...(options.coverage ? ['--coverage'] : []),
    ...(options.verbose ? ['--verbose'] : []),
    ...(options.silent ? ['--silent'] : []),
    ...(options.bail ? ['--bail'] : []),
    ...(options.ci ? ['--ci', '--watchAll=false'] : []),
  ];

  console.log(`Running: jest ${jestArgs.join(' ')}\n`);

  const jest = spawn('npx', ['jest', ...jestArgs], {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
  });

  jest.on('close', (code) => {
    process.exit(code);
  });

  jest.on('error', (error) => {
    console.error('Failed to start Jest:', error);
    process.exit(1);
  });
}

function parseOptions(args) {
  const options = {};
  
  args.forEach(arg => {
    switch (arg) {
      case '--verbose':
        options.verbose = true;
        break;
      case '--silent':
        options.silent = true;
        break;
      case '--bail':
        options.bail = true;
        break;
      case '--ci':
        options.ci = true;
        break;
    }
  });
  
  return options;
}

// Main execution
function main() {
  const suite = args[1] || 'all';
  const options = parseOptions(args.slice(2));

  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    case 'run':
      if (!testConfigs[suite]) {
        console.error(`Unknown test suite: ${suite}`);
        console.error(`Available suites: ${Object.keys(testConfigs).join(', ')}`);
        process.exit(1);
      }
      
      console.log(`Running ${testConfigs[suite].description}...\n`);
      runJest(testConfigs[suite].patterns, options);
      break;

    case 'watch':
      if (!testConfigs[suite]) {
        console.error(`Unknown test suite: ${suite}`);
        console.error(`Available suites: ${Object.keys(testConfigs).join(', ')}`);
        process.exit(1);
      }
      
      console.log(`Watching ${testConfigs[suite].description}...\n`);
      runJest(testConfigs[suite].patterns, { ...options, watch: true });
      break;

    case 'coverage':
      if (!testConfigs[suite]) {
        console.error(`Unknown test suite: ${suite}`);
        console.error(`Available suites: ${Object.keys(testConfigs).join(', ')}`);
        process.exit(1);
      }
      
      console.log(`Running ${testConfigs[suite].description} with coverage...\n`);
      runJest(testConfigs[suite].patterns, { ...options, coverage: true });
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Use "help" to see available commands');
      process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\nTest runner interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nTest runner terminated');
  process.exit(0);
});

// Run the script
main();
