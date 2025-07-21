/**
 * Simple test suite for offline estimate functionality
 * This can be run in the browser console to validate the offline system
 */

import { offlineEstimateService } from '../Services/OfflineEstimateService';
import { localPricingEngine } from '../Services/LocalPricingEngine';
import { configCacheService } from '../Services/ConfigCacheService';

export class OfflineEstimateTest {
  /**
   * Run all tests
   */
  public static async runAllTests(): Promise<void> {
    console.log('🧪 Starting Offline Estimate Tests...');

    try {
      await this.testConfigCaching();
      await this.testPricingEngine();
      await this.testEstimateGeneration();
      await this.testEstimateStorage();

      console.log('✅ All tests passed!');
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  /**
   * Test configuration caching
   */
  private static async testConfigCaching(): Promise<void> {
    console.log('📋 Testing configuration caching...');

    // Mock configuration data
    const mockConfig = {
      windowTypes: [
        { Type: 'Casement Window', Cost: 500 },
        { Type: 'Sash Window', Cost: 750 },
      ],
      extras: {
        extras: [
          { Name: 'Security Lock', Cost: 50 },
          { Name: 'Trickle Vent', Cost: 25 },
        ],
      },
      finishes: {
        finishes: [
          { Name: 'White', Cost: 0 },
          { Name: 'Oak', Cost: 100 },
        ],
      },
      companyInfo: {
        name: 'Test Windows Ltd',
      },
      pdfTextConfig: {
        formats: {
          vat_rate: 0.2,
        },
      },
      options: [
        { id: 1, name: 'Option 1' },
        { id: 2, name: 'Option 2' },
      ],
    };

    // Cache the configuration
    await configCacheService.cacheConfig(mockConfig);

    // Retrieve and verify
    const cachedConfig = await configCacheService.getConfig();

    if (!cachedConfig || cachedConfig.windowTypes.length === 0) {
      throw new Error('Configuration caching failed');
    }

    console.log('✅ Configuration caching works');
  }

  /**
   * Test pricing engine
   */
  private static async testPricingEngine(): Promise<void> {
    console.log('💰 Testing pricing engine...');

    // Initialize pricing engine
    await localPricingEngine.initialize();

    // Test window pricing
    const testWindow = {
      type: 'Casement Window',
      quantity: 2,
      extras: [{ name: 'Security Lock' }],
      paint_finish: 'Oak',
    };

    const pricing = localPricingEngine.calculateWindowPricing(testWindow);

    if (pricing.basePrice === 0) {
      throw new Error('Window pricing calculation failed');
    }

    console.log('✅ Pricing engine works', pricing);
  }

  /**
   * Test estimate generation
   */
  private static async testEstimateGeneration(): Promise<void> {
    console.log('📄 Testing estimate generation...');

    const testEstimateData = {
      customerInfo: {
        title: 'Mr',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '01234 567890',
        address: '123 Test Street\nTest City\nTE1 2ST',
      },
      windows: [
        {
          room: 'Living Room',
          type: 'Casement Window',
          quantity: 2,
          extras: [{ name: 'Security Lock' }],
          paint_finish: 'Oak',
          options: [1],
        },
      ],
      selectedCaveats: {
        'This quotation is valid for 30 days': true,
      },
    };

    const estimate =
      await offlineEstimateService.generateEstimate(testEstimateData);

    if (!estimate.referenceNumber || estimate.breakdown.total === 0) {
      throw new Error('Estimate generation failed');
    }

    console.log(
      '✅ Estimate generation works',
      estimate.referenceNumber,
      estimate.breakdown.total
    );
  }

  /**
   * Test estimate storage and retrieval
   */
  private static async testEstimateStorage(): Promise<void> {
    console.log('💾 Testing estimate storage...');

    // Get all estimates
    const estimates = await offlineEstimateService.getAllEstimates();

    if (estimates.length === 0) {
      throw new Error('No estimates found - storage test inconclusive');
    }

    // Test retrieving a specific estimate
    const firstEstimate = estimates[0];
    const retrievedEstimate = await offlineEstimateService.getEstimateById(
      firstEstimate.id
    );

    if (!retrievedEstimate || retrievedEstimate.id !== firstEstimate.id) {
      throw new Error('Estimate retrieval failed');
    }

    console.log('✅ Estimate storage and retrieval works');
  }

  /**
   * Test estimate validation
   */
  public static async testEstimateValidation(): Promise<void> {
    console.log('🔍 Testing estimate validation...');

    await localPricingEngine.initialize();

    const validWindows = [
      {
        type: 'Casement Window',
        quantity: 1,
        room: 'Test Room',
      },
    ];

    const invalidWindows = [
      {
        type: 'NonExistent Window',
        quantity: 0,
        room: '',
      },
    ];

    const validResult = localPricingEngine.validatePricing(validWindows);
    const invalidResult = localPricingEngine.validatePricing(invalidWindows);

    if (validResult.valid !== true || invalidResult.valid !== false) {
      throw new Error('Validation logic failed');
    }

    console.log('✅ Estimate validation works');
  }

  /**
   * Clean up test data
   */
  public static async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');

    try {
      const estimates = await offlineEstimateService.getAllEstimates();

      for (const estimate of estimates) {
        if (estimate.customerDetails.email === 'john.doe@example.com') {
          await offlineEstimateService.deleteEstimate(estimate.id);
          console.log('🗑️ Deleted test estimate:', estimate.referenceNumber);
        }
      }

      console.log('✅ Test data cleanup complete');
    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error);
    }
  }
}

// Export for browser console testing
(window as any).OfflineEstimateTest = OfflineEstimateTest;

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  console.log(
    '🔧 Development mode detected - offline estimate tests available'
  );
  console.log(
    'Run OfflineEstimateTest.runAllTests() in console to test offline functionality'
  );
}
