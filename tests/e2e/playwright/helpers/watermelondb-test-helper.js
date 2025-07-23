/**
 * WatermelonDB Test Helper
 * Provides utilities for testing WatermelonDB functionality with proper configuration sync
 */

/**
 * Sync configuration data from API to WatermelonDB for testing
 * This simulates the real-world scenario where users go online first to sync data
 */
export async function syncConfigurationData(page) {
  console.log('Syncing configuration data from API to WatermelonDB...');
  
  // Wait for WatermelonDB service to be available
  await page.evaluate(async () => {
    // Wait for watermelonDBService to be available on window
    let attempts = 0;
    while (!window.watermelonDBService && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.watermelonDBService) {
      throw new Error('WatermelonDB service not available for configuration sync');
    }
  });

  // Sync window types from API
  await page.evaluate(async () => {
    try {
      // Simulate API response for window types
      const windowTypesData = [
        { id: 1, name: 'Softwood Sash Window S', type: 'sash', cost: 450, is_active: true },
        { id: 2, name: 'Hardwood Sash Window H', type: 'sash', cost: 650, is_active: true },
        { id: 3, name: 'Casement Window', type: 'casement', cost: 350, is_active: true },
        { id: 4, name: 'Tilt & Turn Window', type: 'tilt_turn', cost: 500, is_active: true },
      ];

      console.log('Syncing window types:', windowTypesData);
      await window.watermelonDBService.syncWindowTypesFromAPI(windowTypesData);

      // Verify the data was stored
      const storedWindowTypes = await window.watermelonDBService.getCachedWindowTypes();
      console.log('Window types after sync:', storedWindowTypes);

      console.log('Window types synced successfully');
    } catch (error) {
      console.error('Failed to sync window types:', error);
      throw error;
    }
  });

  // Sync finishes from API
  await page.evaluate(async () => {
    try {
      // Simulate API response for finishes
      const finishesData = {
        glass_specifications: [
          { id: 1, name: 'Clear Double Glazed', cost: 0, is_active: true },
          { id: 2, name: 'Obscure Double Glazed', cost: 25, is_active: true },
          { id: 3, name: 'Triple Glazed', cost: 150, is_active: true },
          { id: 4, name: 'Laminated Glass', cost: 75, is_active: true },
        ],
        paint_finishes: [
          { id: 1, name: 'White', cost: 0, is_active: true },
          { id: 2, name: 'Cream', cost: 15, is_active: true },
          { id: 3, name: 'Black', cost: 30, is_active: true },
          { id: 4, name: 'Green', cost: 25, is_active: true },
        ],
        hardware_finishes: [
          { id: 1, name: 'Chrome', cost: 0, is_active: true },
          { id: 2, name: 'Brass', cost: 20, is_active: true },
          { id: 3, name: 'Black', cost: 25, is_active: true },
          { id: 4, name: 'Satin Nickel', cost: 30, is_active: true },
        ],
      };
      
      await window.watermelonDBService.syncFinishesFromAPI(finishesData);
      console.log('Finishes synced successfully');
    } catch (error) {
      console.error('Failed to sync finishes:', error);
      throw error;
    }
  });

  // Sync extras from API
  await page.evaluate(async () => {
    try {
      // Simulate API response for extras
      const extrasData = [
        { id: 1, name: 'Security Locks', cost: 45, category: 'security', is_active: true },
        { id: 2, name: 'Trickle Vents', cost: 25, category: 'ventilation', is_active: true },
        { id: 3, name: 'Georgian Bars', cost: 35, category: 'decorative', is_active: true },
        { id: 4, name: 'Window Restrictors', cost: 20, category: 'safety', is_active: true },
      ];
      
      await window.watermelonDBService.syncExtrasFromAPI(extrasData);
      console.log('Extras synced successfully');
    } catch (error) {
      console.error('Failed to sync extras:', error);
      throw error;
    }
  });

  // Sync company info from API
  await page.evaluate(async () => {
    try {
      // Simulate API response for company info
      const companyInfoData = {
        name: 'Test Window Company',
        address: '123 Business Street, Test City, TC1 2AB',
        phone: '01234 567890',
        email: 'info@testwindows.com',
        website: 'www.testwindows.com',
        vat_number: 'GB123456789',
        registration_number: '12345678',
      };
      
      await window.watermelonDBService.syncCompanyInfoFromAPI(companyInfoData);
      console.log('Company info synced successfully');
    } catch (error) {
      console.error('Failed to sync company info:', error);
      throw error;
    }
  });

  console.log('All configuration data synced successfully to WatermelonDB');
}

/**
 * Wait for configuration data to be loaded in the UI
 * This ensures the Wizard component has loaded the cached data from WatermelonDB
 */
export async function waitForConfigurationToLoad(page) {
  console.log('Waiting for configuration data to load in UI...');
  
  // Wait for the configuration to be loaded and applied to the UI
  await page.waitForFunction(() => {
    // Check if finishes dropdowns have options (indicating config is loaded)
    const glassSelect = document.getElementById('glass_specification');
    const paintSelect = document.getElementById('paint_finish');
    const hardwareSelect = document.getElementById('hardware_finish');
    
    return (
      glassSelect && glassSelect.options.length > 1 &&
      paintSelect && paintSelect.options.length > 1 &&
      hardwareSelect && hardwareSelect.options.length > 1
    );
  }, { timeout: 15000 });
  
  console.log('Configuration data loaded in UI successfully');
}

/**
 * Verify that configuration data is available in WatermelonDB
 */
export async function verifyConfigurationData(page) {
  const configData = await page.evaluate(async () => {
    const windowTypes = await window.watermelonDBService.getCachedWindowTypes();
    const finishes = await window.watermelonDBService.getCachedFinishes();
    const extras = await window.watermelonDBService.getCachedExtras();
    const companyInfo = await window.watermelonDBService.getCachedCompanyInfo();
    
    return {
      windowTypes: windowTypes.length,
      glassSpecs: finishes.glass_specifications?.length || 0,
      paintFinishes: finishes.paint_finishes?.length || 0,
      hardwareFinishes: finishes.hardware_finishes?.length || 0,
      extras: extras.length,
      hasCompanyInfo: Object.keys(companyInfo).length > 0,
    };
  });
  
  console.log('Configuration data verification:', configData);
  
  // Verify we have the expected data
  if (configData.windowTypes < 3) throw new Error('Insufficient window types data');
  if (configData.glassSpecs < 3) throw new Error('Insufficient glass specifications data');
  if (configData.paintFinishes < 3) throw new Error('Insufficient paint finishes data');
  if (configData.hardwareFinishes < 3) throw new Error('Insufficient hardware finishes data');
  if (configData.extras < 3) throw new Error('Insufficient extras data');
  if (!configData.hasCompanyInfo) throw new Error('Company info not available');
  
  return configData;
}
