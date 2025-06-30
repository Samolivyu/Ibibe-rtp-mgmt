// playwright.config.js
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url'; // Needed for __dirname equivalent in ES Modules

// __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the domains configuration to dynamically create projects
import domainsConfig from './config/domains.js'; // Ensure domains.js is an ES Module and has .js extension

// Define the path to your global setup/teardown files as strings
const globalSetupPath = path.resolve(__dirname, './playwright-globe-setup.js');
const globalTeardownPath = path.resolve(__dirname, './playwright-globe-teardown.js'); // Assuming this file exists and exports default


export default defineConfig({
  // Global setup to authenticate across platforms
  globalSetup: globalSetupPath, // Pass the string path
  globalTeardown: globalTeardownPath, // Pass the string path

  // Directory where your Playwright tests are located
  testDir: './tests', // Assumes your tests are under RTP/tests

  // Only run files ending with .spec.js (or .test.js)
  testMatch: [
    "tests/**/*.spec.js", // Matches all .spec.js files within the tests directory
  ],

  // Maximum time one test can run for
  timeout: 120000, // 120 seconds, adjust as needed for long RTP tests

  fullyParallel: true, // Run tests in files in parallel
  forbidOnly: !!process.env.CI, // Fail on CI if test.only is left
  retries: process.env.CI ? 2 : 0, // Retry on CI
  workers: process.env.CI ? 1 : undefined, // Opt out of parallel tests on CI

  // Reporter to use
  reporter: 'html', // Generates the HTML report

  // --- Define Projects for each company/platform ---
  projects: Object.keys(domainsConfig).map(companyKey => {
    const company = domainsConfig[companyKey];
    const storageStatePath = path.join(process.cwd(), `playwright-auth-state-${companyKey}.json`);

    return {
      name: companyKey, // Project name (e.g., 'playtest', 'casinoclient')
      // Use the saved authentication state for this project
      use: {
        storageState: storageStatePath,
        baseURL: company.gameBaseUrl || company.loginUrl, // Use gameBaseUrl as the base URL for tests
        ...devices['Desktop Chrome'], // You can specify other browsers if needed
        trace: 'on-first-retry', // Collect trace on first retry
      },
      // Optionally, you can narrow down which tests run for this project if needed,
      // but typically, tests would handle the 'company' loop internally.
      // testMatch: `tests/${companyKey}/**/*.spec.js`, // Example if tests are segregated by company folder
    };
  }).concat([
    // Add a 'general' project if you have tests that don't need specific authentication
    // or if you want to run all tests against a default unauthenticated context.
    // {
    //   name: 'general-unauthenticated',
    //   use: { ...devices['Desktop Chrome'] },
    // }
  ])
});
