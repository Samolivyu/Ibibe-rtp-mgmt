import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import domainsConfig from './config/domains.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  globalSetup: path.resolve(__dirname, './playwright-globe-setup.js'),
  globalTeardown: path.resolve(__dirname, './playwright-globe-teardown.js'),
  
  testDir: './tests',
  testMatch: ["tests/**/*.spec.js"],
  
  timeout: 300000, // Increased timeout for RTP tests
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Enhanced reporting configuration
  reporter: [
    ['html', { outputFolder: 'data/reports/html' }],
    ['json', { outputFile: 'data/reports/json/results.json' }],
    ['list'],
    ['./reports/custom-report.js'] // Custom RTP reporter
  ],
  
  use: {
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'on',
  },
  
  projects: Object.keys(domainsConfig).map(companyKey => {
    const company = domainsConfig[companyKey];
    return {
      name: companyKey,
      use: {
        ...devices['Desktop Chrome'],
        storageState: `playwright-auth-state-${companyKey}.json`,
        baseURL: company.gameBaseUrl,
        // Platform-specific context
        companyConfig: company
      },
      metadata: {
        platform: companyKey,
        rtpSpins: process.env.RTP_TEST_SPINS || 5000,
        rtpBatchSize: process.env.RTP_BATCH_SIZE || 500
      }
    };
  })
});