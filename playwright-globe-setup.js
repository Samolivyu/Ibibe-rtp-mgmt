// playwright-globe-setup.js
// This script runs once before all tests to authenticate across multiple platforms.
// It is fully ES Modules compliant.

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Load environment variables (assuming .env is at the project root)
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Import the domains configuration using ES Module syntax
import domainsConfig from './config/domains.js'; // Ensure domains.js is also an ES Module and has .js extension

async function globalSetup() {
  console.log('\n--- Playwright Global Setup: Starting Multi-Platform Authentication ---');

  // Define a directory for screenshots to help debug
  const debugScreenshotDir = path.join(process.cwd(), 'playwright-debug-screenshots');
  if (!fs.existsSync(debugScreenshotDir)) {
    fs.mkdirSync(debugScreenshotDir);
  }

  // Iterate through each company defined in domains.js
  for (const companyKey of Object.keys(domainsConfig)) {
    const company = domainsConfig[companyKey];
    const STORAGE_STATE_PATH = path.join(process.cwd(), `playwright-auth-state-${companyKey}.json`);

    console.log(`\nAttempting to authenticate for: ${company.companyName} (${companyKey})`);

    if (!company.loginUrl || !company.username || !company.password) {
      console.warn(`WARNING: Login URL or credentials missing for ${company.companyName}. Skipping authentication.`);
      continue;
    }

    // Launch browser in non-headless mode for easier visual debugging
    // `slowMo` adds a delay between actions, helpful for observing steps
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    try {
      console.log(`Navigating to login URL: ${company.loginUrl}`);
      // Navigate to the login page and wait for content to load
      await page.goto(company.loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-login-page.png`) });
      console.log(`Screenshot saved: ${companyKey}-login-page.png`);


      let usernameSelector, passwordSelector, submitButtonSelector;
      let postLoginUrlPattern; // To help with waitForURL


      if (companyKey === 'playtest') {
        // --- Play Test Platform Selectors ---
        // !!! IMPORTANT: YOU MUST REPLACE THESE WITH THE ACTUAL SELECTORS FOUND ON YOUR PLAY TEST LOGIN PAGE !!!
        // Use browser's DevTools (F12) -> Elements tab, inspect the username/password inputs and login button.
        // For example, if the username input's HTML is <input id="username_field_123" name="username">,
        // you might use '#username_field_123' or 'input[name="username"]'.
        usernameSelector = 'input[id="playtest-username-field"]'; // <-- REPLACE THIS EXAMPLE SELECTOR
        passwordSelector = 'input[id="playtest-password-field"]'; // <-- REPLACE THIS EXAMPLE SELECTOR
        submitButtonSelector = 'button[id="playtest-login-button"]'; // <-- REPLACE THIS EXAMPLE SELECTOR
        postLoginUrlPattern = 'playgamestest.ibibe.cloud/dashboard'; // Example: URL pattern after successful login
        console.log("Using Play Test specific selectors.");

      } else if (companyKey === 'casinoclient') {
        // --- Casino Client Platform Selectors ---
        // !!! IMPORTANT: YOU MUST REPLACE THESE WITH THE ACTUAL SELECTORS FOUND ON YOUR CASINO CLIENT LOGIN PAGE !!!
        // For example, if the email input's HTML is <input type="email" class="form-control email-field">,
        // you might use 'input[type="email"]' or 'input.email-field'.
        usernameSelector = 'input[name="userEmail"]'; // <-- REPLACE THIS EXAMPLE SELECTOR
        passwordSelector = 'input[name="userPassword"]'; // <-- REPLACE THIS EXAMPLE SELECTOR
        submitButtonSelector = 'button.login-submit-btn'; // <-- REPLACE THIS EXAMPLE SELECTOR
        postLoginUrlPattern = 'casino.client.ibibe.africa/home'; // Example: URL pattern after successful login
        console.log("Using Casino Client specific selectors.");

      } else {
        console.warn(`No specific selectors defined for ${companyKey}. Using generic selectors which might fail.`);
        usernameSelector = 'input[name="username"]';
        passwordSelector = 'input[name="password"]';
        submitButtonSelector = 'button[type="submit"]';
        postLoginUrlPattern = company.gameBaseUrl || company.loginUrl;
      }

      // Debugging: Wait for the username field explicitly and screenshot if it appears
      console.log(`Waiting for username selector: '${usernameSelector}'`);
      await page.waitForSelector(usernameSelector, { state: 'visible', timeout: 15000 }); // Shorter timeout for individual selector
      await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-username-field-found.png`) });


      await page.fill(usernameSelector, company.username);
      await page.fill(passwordSelector, company.password); // Ensure password selector is also correct

      console.log(`Waiting for submit button selector: '${submitButtonSelector}'`);
      await page.waitForSelector(submitButtonSelector, { state: 'visible', timeout: 15000 });
      await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-submit-button-found.png`) });

      await page.click(submitButtonSelector);

      // Wait for navigation to complete after login
      console.log(`Waiting for URL to change after login (pattern: '${postLoginUrlPattern}')...`);
      await page.waitForURL(url => url.includes(postLoginUrlPattern), { timeout: 30000 });
      await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-post-login.png`) });


      console.log(`Login successful for ${company.companyName}! Saving authentication state.`);
      await page.context().storageState({ path: STORAGE_STATE_PATH });

    } catch (error) {
      console.error(`ERROR: Authentication failed for ${company.companyName} (${companyKey}): ${error.message}`);
      await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-failure-page.png`) }); // Screenshot on failure
      console.log(`Screenshot saved: ${companyKey}-failure-page.png`);

      // Clean up potentially stale auth state
      if (fs.existsSync(STORAGE_STATE_PATH)) {
        fs.unlinkSync(STORAGE_STATE_PATH);
        console.log(`Removed incomplete state file: ${STORAGE_STATE_PATH}`);
      }
      throw error; // Re-throw the error to ensure Playwright reports global setup failure
    } finally {
      await browser.close();
    }
  }
  console.log('\n--- Multi-Platform Authentication Setup Complete ---');
}

// Export the globalSetup function as a default ES Module export
export default globalSetup;
