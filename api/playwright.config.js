import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import domainsConfig from './config/domains.js'; // Import domains config

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Global setup and teardown for authentication (optional, can be done per test too)
  // globalSetup: path.resolve(__dirname, './playwright-globe-setup.js'), // If you have a global login
  // globalTeardown: path.resolve(__dirname, './playwright-globe-teardown.js'), // If you have a global logout
  
  testDir: './tests', // Location of your test files
  testMatch: ["tests/**/*.spec.js"], // Match all .spec.js files in tests folder
  
  timeout: 600000, // Increased timeout for RTP tests (10 minutes)
  fullyParallel: false, // Set to true if tests can run independently across projects
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined, // Number of parallel workers
  
  // Enhanced reporting configuration
  reporter: [
    ['list'], // Console reporter
    ['html', { outputFolder: 'reports/html', open: 'never' }], // HTML report
    ['json', { outputFile: 'reports/json/results.json' }], // JSON report
    ['junit', { outputFile: 'reports/junit/results.xml' }], // JUnit XML report for CI/CD
    // ['./api/src/reports/custom-report.js'] // If you want to integrate your custom reporter here
  ],
  
  use: {
    trace: 'on-first-retry', // Record traces for failed tests
    video: 'on-first-retry', // Record video for failed tests
    screenshot: 'only-on-failure', // Take screenshot on failure
    // Pass company config to each test project
    // This is handled by the projects array below
  },
  
  projects: Object.keys(domainsConfig).map(companyKey => {
    const company = domainsConfig[companyKey];
    return {
      name: companyKey, // Project name (e.g., 'playtest', 'casinoclient')
      use: {
        ...devices['Desktop Chrome'], // Use Chrome browser
        baseURL: company.gameBaseUrl, // Base URL for page navigation
        // Pass the full company config to the test context
        companyConfig: company,
        // You might need to manage storageState if you have browser-based login sessions
        // storageState: `playwright-auth-state-${companyKey}.json`, 
      },
      // Metadata can be accessed in tests via testInfo.project.metadata
      metadata: {
        platform: companyKey,
        username: company.username,
        password: company.password,
        testUserId: company.testUserId,
        currency: company.currency,
        apiBaseUrl: company.apiBaseUrl,
        gameListEndpoint: company.gameListEndpoint,
        rtpEndpoint: company.rtpEndpoint,
        sessionCreationEndpoint: company.sessionCreationEndpoint,
        adminApiKey: company.headers['X-API-Key'],
        authMethod: company.auth.method,
        // Add any other relevant config from domains.js or .env
      }
    };
  })
});