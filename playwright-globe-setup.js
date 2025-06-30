// playwright-globe-setup.js

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
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    try {
      console.log(`Navigating to login URL: ${company.loginUrl}`);
      await page.goto(company.loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-initial-page.png`) });
      console.log(`Screenshot saved: ${companyKey}-initial-page.png`);


      let usernameSelector, passwordSelector, submitButtonSelector;
      let initialLoginButtonSelector; // Selector for the button to click to reveal the form
      let postLoginUrlPattern;


      if (companyKey === 'playtest') {
        // --- Play Test Platform Selectors ---
        // Initial button to click to open the login form (based on previous HTML)
        initialLoginButtonSelector = 'button.text-secondary.bg-white.border:has-text("Login")';
        // Confirmed username selector based on provided HTML
        usernameSelector = 'input[name="username"]'; 
        // Confirmed password selector based on provided HTML
        passwordSelector = 'input[name="password"]'; 
        // CONFIRMED FINAL SUBMIT BUTTON SELECTOR BASED ON PROVIDED HTML
        submitButtonSelector = 'input[type="submit"][value="Sign In"]'; 
        postLoginUrlPattern = 'playgamestest.ibibe.cloud/dashboard';
        console.log("Using Play Test specific selectors.");

      } else if (companyKey === 'casinoclient') {
        // --- Casino Client Platform Selectors ---
        // Initial button to click to open the login form (based on previous HTML)
        initialLoginButtonSelector = 'button.text-secondary.bg-white.border:has-text("Login")'; 
        // Confirmed username selector based on provided HTML
        usernameSelector = 'input[name="username"]'; 
        // Confirmed password selector based on provided HTML
        passwordSelector = 'input[name="password"]'; 
        // CONFIRMED FINAL SUBMIT BUTTON SELECTOR BASED ON PROVIDED HTML
        submitButtonSelector = 'input[type="submit"][value="Sign In"]'; 
        postLoginUrlPattern = 'casino.client.ibibe.africa/home';
        console.log("Using Casino Client specific selectors.");

      } else {
        console.warn(`No specific selectors defined for ${companyKey}. Using generic selectors which might fail.`);
        initialLoginButtonSelector = 'button:has-text("Login")';
        usernameSelector = 'input[name="username"]';
        passwordSelector = 'input[name="password"]';
        submitButtonSelector = 'button[type="submit"]';
        postLoginUrlPattern = company.gameBaseUrl || company.loginUrl;
      }

      // --- Click the initial login button to reveal the form ---
      console.log(`Waiting for and clicking initial Login button: '${initialLoginButtonSelector}'`);
      await page.waitForSelector(initialLoginButtonSelector, { state: 'visible', timeout: 15000 });
      await page.click(initialLoginButtonSelector);
      await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-after-initial-login-button-click.png`) });
      console.log(`Screenshot saved: ${companyKey}-after-initial-login-button-click.png`);

      // Now, the actual login form fields should be visible.
      console.log(`Waiting for username selector: '${usernameSelector}'`);
      // Increased timeout slightly for first input to allow form transition
      await page.waitForSelector(usernameSelector, { state: 'visible', timeout: 20000 }); 
      await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-username-field-found.png`) });

      await page.fill(usernameSelector, company.username);
      await page.fill(passwordSelector, company.password);

      console.log(`Waiting for submit button selector: '${submitButtonSelector}'`);
      await page.waitForSelector(submitButtonSelector, { state: 'visible', timeout: 15000 });
      await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-submit-button-found.png`) });

      await page.click(submitButtonSelector);

      // Wait for navigation to complete after login
      console.log(`Waiting for URL to change after login (pattern: '${postLoginUrlPattern}')...`);
      // FIX: Convert URL object to string before using .includes()
      await page.waitForURL(url => url.toString().includes(postLoginUrlPattern), { timeout: 30000 }); 
      await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-post-login.png`) });

      console.log(`Login successful for ${company.companyName}! Saving authentication state.`);
      await page.context().storageState({ path: STORAGE_STATE_PATH });

    } catch (error) {
      console.error(`ERROR: Authentication failed for ${company.companyName} (${companyKey}): ${error.message}`);
      await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-failure-page.png`) });
      console.log(`Screenshot saved: ${companyKey}-failure-page.png`);

      // Clean up potentially stale auth state
      if (fs.existsSync(STORAGE_STATE_PATH)) {
        fs.unlinkSync(STORAGE_STATE_PATH);
        console.log(`Removed incomplete state file: ${STORAGE_STATE_PATH}`);
      }
      throw error;
    } finally {
      await browser.close();
    }
  }
  console.log('\n--- Multi-Platform Authentication Setup Complete ---');
}

export default globalSetup;
