module.exports = {
  timeout: 600000, // 10 minutes
  retries: 2,
  workers: 3,
  testDir: './src/tests', // Explicitly specify test directory
  reporter: [
    ['list'],
    ['html', { 
      outputFolder: 'reports/results',
      open: 'never'
    }],
    ['./src/reports/custom-report.js']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'rtp-validation',
      testMatch: '**/*.spec.js' // Match all spec files
    }
  ]
};