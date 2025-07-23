import { chromium } from '@playwright/test';

async function debugLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:8888/login');

    console.log('Waiting for login form...');
    await page.waitForSelector('#email');

    console.log('Filling form...');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');

    console.log('Taking screenshot before submit...');
    await page.screenshot({ path: 'before-login.png' });

    console.log('Clicking login button...');
    await page.click('text=Log in');

    console.log('Waiting for response...');
    await page.waitForTimeout(3000);

    console.log('Current URL:', page.url());

    console.log('Taking screenshot after submit...');
    await page.screenshot({ path: 'after-login.png' });

    // Check for any error messages
    const errors = await page.$$eval(
      '.text-red-600, .error, [role="alert"]',
      elements => elements.map(el => el.textContent)
    );

    if (errors.length > 0) {
      console.log('Errors found:', errors);
    } else {
      console.log('No visible errors found');
    }

    // Check form validation state
    const emailValue = await page.inputValue('#email');
    const passwordValue = await page.inputValue('#password');
    console.log(
      'Form values - Email:',
      emailValue,
      'Password:',
      passwordValue ? '[FILLED]' : '[EMPTY]'
    );

    // Check if button is disabled
    const buttonDisabled = await page.isDisabled('text=Log in');
    console.log('Login button disabled:', buttonDisabled);
  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await browser.close();
  }
}

debugLogin();
