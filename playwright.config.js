// playwright.config.js 
// // @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Changed from './test-results' to './tests' where your actual test files are
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
   reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['./src/playwright-report/custom-report.js']
  ],
  
  /* Global test timeout */
  timeout: 30000,
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 10000
  },
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000', // Uncommented for local development
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,
    
    /* Set viewport size */
    viewport: { width: 1280, height: 720 },
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  testMatch: '**/*.spec.js', 

  /* Configure projects for major browsers and test types */
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests',
      testMatch: ['**/*.spec.js', '!**/load/**'] // Exclude load tests from regular runs
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testDir: './tests',
      testMatch: ['**/*.spec.js', '!**/load/**']
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testDir: './tests',
      testMatch: ['**/*.spec.js', '!**/load/**']
    },

    // API and Load Testing Projects
    {
      name: 'api-tests',
      testDir: './tests',
      testMatch: ['api-*.spec.js'],
      use: {
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },

    {
      name: 'websocket-tests',
      testDir: './tests',
      testMatch: ['websocket.spec.js'],
      use: {
        baseURL: 'ws://localhost:3000', // WebSocket base URL
      },
    },

    {
      name: 'load-tests',
      testDir: './load',
      testMatch: ['**/*.js'],
      use: {
        baseURL: 'http://localhost:3000',
      },
      timeout: 60000, // Longer timeout for load tests
    },

    /* Test against mobile viewports for responsive testing */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testDir: './tests',
      testMatch: ['**/*.spec.js', '!api-*.spec.js', '!websocket.spec.js'] // Skip API tests on mobile
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testDir: './tests',
      testMatch: ['**/*.spec.js', '!api-*.spec.js', '!websocket.spec.js']
    },
    
    {
      name: 'api-tests',
      testMatch: '**/api-*.spec.js', // Add explicit pattern
    },
    {
      name: 'websocket-tests',
      testMatch: '**/websocket.spec.js', // Add explicit pattern
    }
  ],

  webServer: {
  command: 'npm run start',
  url: 'http://localhost:3000/health', // Add health check
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
  healthTimeout: 5000 // Wait for health check
  },

  /* Test result and artifact directories */
  outputDir: 'test-results/',
  
  /* Global setup and teardown */
  // globalSetup: require.resolve('./tests/global-setup'),
  // globalTeardown: require.resolve('./tests/global-teardown'),
});