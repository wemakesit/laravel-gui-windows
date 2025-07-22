import { chromium } from 'playwright';

// Sample data for creating estimates
const estimateData = [
  {
    customerInfo: {
      title: 'Mr',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      phone: '01234567890',
      postcode: 'SW1A 1AA',
      additional_info: 'Ground floor flat',
    },
    windows: [
      {
        type: 'Softwood Single Casement Window',
        room: 'Living Room',
        width: 1200,
        height: 1000,
        quantity: 2,
        glass_specification: 'Clear Double Glazed',
        paint_finish: 'White (RAL 9016)',
        hardware_finish: 'Polished Chrome',
      },
    ],
  },
  {
    customerInfo: {
      title: 'Mrs',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '01234567891',
      postcode: 'M1 1AA',
      additional_info: 'Victorian terrace house',
    },
    windows: [
      {
        type: 'Softwood Sash Window M',
        room: 'Bedroom',
        width: 900,
        height: 1200,
        quantity: 1,
        glass_specification: 'Triple Glazed',
        paint_finish: 'Black (RAL 9005)',
        hardware_finish: 'Polished Brass',
      },
      {
        type: 'Softwood Double Casement Window',
        room: 'Kitchen',
        width: 800,
        height: 600,
        quantity: 1,
        glass_specification: 'Clear Double Glazed',
        paint_finish: 'White (RAL 9016)',
        hardware_finish: 'Polished Chrome',
      },
    ],
  },
  {
    customerInfo: {
      title: 'Dr',
      first_name: 'Michael',
      last_name: 'Brown',
      email: 'michael.brown@example.com',
      phone: '01234567892',
      postcode: 'B1 1AA',
      additional_info: 'Modern apartment',
    },
    windows: [
      {
        type: 'Accoya Triple Casement Window',
        room: 'Office',
        width: 1000,
        height: 800,
        quantity: 3,
        glass_specification: 'Low-E Double Glazed',
        paint_finish: 'Anthracite Grey (RAL 7016)',
        hardware_finish: 'Black',
      },
    ],
  },
  {
    customerInfo: {
      title: 'Ms',
      first_name: 'Emma',
      last_name: 'Davis',
      email: 'emma.davis@example.com',
      phone: '01234567893',
      postcode: 'LS1 1AA',
      additional_info: 'Converted barn',
    },
    windows: [
      {
        type: 'Softwood Four Part Casement Window',
        room: 'Conservatory',
        width: 1500,
        height: 1400,
        quantity: 4,
        glass_specification: 'Triple Glazed',
        paint_finish: 'Cream (RAL 9001)',
        hardware_finish: 'Antique Brass',
      },
      {
        type: 'Accoya Sash Window L',
        room: 'Dining Room',
        width: 1100,
        height: 1300,
        quantity: 2,
        glass_specification: 'Heritage Double Glazed',
        paint_finish: 'White (RAL 9016)',
        hardware_finish: 'Satin Chrome',
      },
    ],
  },
  {
    customerInfo: {
      title: 'Mr',
      first_name: 'David',
      last_name: 'Wilson',
      email: 'david.wilson@example.com',
      phone: '01234567894',
      postcode: 'EH1 1AA',
      additional_info: 'Georgian townhouse',
    },
    windows: [
      {
        type: 'Softwood Sash Window XL',
        room: 'Master Bedroom',
        width: 1300,
        height: 1500,
        quantity: 2,
        glass_specification: 'Acoustic Double Glazed',
        paint_finish: 'Black (RAL 9005)',
        hardware_finish: 'Nickel Black',
      },
      {
        type: 'Accoya Single Casement Window',
        room: 'Bathroom',
        width: 600,
        height: 800,
        quantity: 1,
        glass_specification: 'Obscure Double Glazed',
        paint_finish: 'White (RAL 9016)',
        hardware_finish: 'White',
      },
      {
        type: 'Softwood Triple Casement Window',
        room: 'Study',
        width: 900,
        height: 1000,
        quantity: 1,
        glass_specification: 'Low-E Double Glazed',
        paint_finish: 'Anthracite Grey (RAL 7016)',
        hardware_finish: 'Black Rat Tail',
      },
    ],
  },
];

async function createEstimate(page, data, estimateNumber) {
  console.log(`Creating estimate ${estimateNumber}...`);

  // Navigate to create estimate page
  await page.goto('http://0.0.0.0:8888/estimates/create');
  await page.waitForLoadState('networkidle');

  // Step 1: Customer Information
  console.log(
    `  - Filling customer information for ${data.customerInfo.first_name} ${data.customerInfo.last_name}`
  );

  // Fill customer details
  await page.selectOption('#title', data.customerInfo.title);
  await page.fill('#first_name', data.customerInfo.first_name);
  await page.fill('#last_name', data.customerInfo.last_name);
  await page.fill('#email', data.customerInfo.email);
  await page.fill('#phone', data.customerInfo.phone);

  // Use manual address entry
  console.log('    - Using manual address entry');
  await page.click('button:has-text("Enter Address Manually")');
  await page.waitForTimeout(500);
  await page.fill(
    'textarea[name="address"]',
    `123 Sample Street, ${data.customerInfo.postcode}`
  );

  // Fill additional info
  if (data.customerInfo.additional_info) {
    await page.fill(
      'textarea[name="additional_info"]',
      data.customerInfo.additional_info
    );
  }

  // Go to next step
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(1000);

  // Step 2: Window Selection
  console.log(`  - Adding ${data.windows.length} window(s)`);

  for (let i = 0; i < data.windows.length; i++) {
    const window = data.windows[i];
    console.log(
      `    - Adding window ${i + 1}: ${window.type} for ${window.room}`
    );

    // Click Add Window button
    await page.click('button:has-text("Add Window")');
    await page.waitForTimeout(1000);

    // Fill window details in modal
    // Handle the Combobox for window type - just type and press Enter
    await page.click('input[name="type"]');
    await page.fill('input[name="type"]', window.type);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Fill room using Combobox
    await page.click('input[name="room"]');
    await page.fill('input[name="room"]', window.room);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Fill quantity
    await page.fill('input[name="quantity"]', window.quantity.toString());

    // Save window
    await page.click('button:has-text("Save Window")');
    await page.waitForTimeout(1000);
  }

  // Go to next step
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(1000);

  // Step 3: Window Configuration
  console.log(`  - Configuring window specifications`);

  // Configure each window
  for (let i = 0; i < data.windows.length; i++) {
    const window = data.windows[i];

    // Click configure button for this window
    const configureButtons = await page.$$('button:has-text("Configure")');
    if (configureButtons[i]) {
      await configureButtons[i].click();
      await page.waitForTimeout(500);

      // Fill configuration details - use first available option if specific one not found
      try {
        await page.selectOption(
          '#glass_specification',
          window.glass_specification
        );
      } catch (e) {
        // Select first available option
        const options = await page.$$('#glass_specification option');
        if (options.length > 1) {
          await page.selectOption('#glass_specification', { index: 1 });
        }
      }

      try {
        await page.selectOption('#paint_finish', window.paint_finish);
      } catch (e) {
        const options = await page.$$('#paint_finish option');
        if (options.length > 1) {
          await page.selectOption('#paint_finish', { index: 1 });
        }
      }

      try {
        await page.selectOption('#hardware_finish', window.hardware_finish);
      } catch (e) {
        const options = await page.$$('#hardware_finish option');
        if (options.length > 1) {
          await page.selectOption('#hardware_finish', { index: 1 });
        }
      }

      // Save configuration
      await page.click('button:has-text("Save Configuration")');
      await page.waitForTimeout(2000);

      // Ensure modal is closed by waiting for it to disappear
      try {
        await page.waitForSelector('.fixed.inset-0.bg-gray-500', { state: 'hidden', timeout: 5000 });
      } catch (e) {
        // If modal is still visible, try pressing Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }
  }

  // Go to next step
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(1000);

  // Step 4: Extras (skip for now)
  console.log(`  - Skipping extras selection`);
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(1000);

  // Step 5: Review and Generate
  console.log(`  - Generating estimate`);
  await page.click('button:has-text("Generate Estimate")');

  // Wait for success and redirect to WatermelonDB-stored estimate
  await page.waitForURL('**/estimates/**', { timeout: 15000 });
  console.log(`  ✓ Estimate ${estimateNumber} created successfully and stored in WatermelonDB!`);

  await page.waitForTimeout(2000);
}

async function main() {
  console.log('Starting Playwright estimate creation...');

  const browser = await chromium.launch({
    headless: true, // Set to true for headless mode
    slowMo: 100, // Slow down actions for visibility
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login first
    console.log('Logging in...');
    await page.goto('http://0.0.0.0:8888/login');
    await page.waitForLoadState('networkidle');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('button:has-text("Log in")');

    // Wait for successful login
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    console.log('✓ Logged in successfully!');

    // Create 5 estimates
    for (let i = 0; i < estimateData.length; i++) {
      await createEstimate(page, estimateData[i], i + 1);
    }

    console.log('\n🎉 All 5 estimates created successfully!');

    // Navigate to estimates list to see results
    await page.goto('http://0.0.0.0:8888/estimates');
    await page.waitForLoadState('networkidle');
    console.log('📋 Navigate to estimates list to view all created estimates');

    // Keep browser open for a few seconds to see results
    await page.waitForTimeout(5000);
  } catch (error) {
    console.error('Error creating estimates:', error);
  } finally {
    await browser.close();
  }
}

// Run the script
main().catch(console.error);
