// tests/rtp-test.spec.js
import { test, expect } from '@playwright/test';
import RTPSimulator from '../src/rtp-sim.js'; // Import the simulator
import { log } from '../src/utils/logger.js'; // Standardized logger
import config from '../config/domains.js'; // To access company configs

test.describe('Automated RTP Validation System', () => {
  let simulator;

  test.beforeAll(async () => {
    // Initialize the simulator once for the entire test suite
    simulator = new RTPSimulator();
    log('Playwright test suite setup: RTP Simulator initialized.', 'info');
  });

  // Test for PlayTest platform
  test('should perform RTP validation for PlayTest platform', async ({ page }, testInfo) => {
    log(`Running RTP validation for PlayTest platform...`, 'info');
    
    // The simulator.run() method already iterates through companies.
    // For specific Playwright tests per company, you might adjust simulator.run()
    // or filter results here. For simplicity, this test will trigger the full run.
    const results = await simulator.run();

    // Filter results for PlayTest specifically if needed for assertions
    const playtestResults = results.filter(r => r.company === 'playtest');

    expect(playtestResults.length).toBeGreaterThan(0, 'Should have tested at least one game for PlayTest.');
    playtestResults.forEach(gameResult => {
      expect(gameResult.spins).toBeGreaterThan(0, `Game ${gameResult.gameName} should have simulated spins.`);
      expect(gameResult.rtp).toBeGreaterThan(0, `Game ${gameResult.gameName} should have a calculated RTP.`);
      expect(gameResult.swaggerValid).toBe(true, `Game ${gameResult.gameName} RTP should be valid against Swagger.`);
      // Add more specific assertions based on your RTP validation criteria
    });

    log('RTP validation for PlayTest platform completed.', 'success');
  });

  // Test for CasinoClient platform
  test('should perform RTP validation for CasinoClient platform', async ({ page }, testInfo) => {
    log(`Running RTP validation for CasinoClient platform...`, 'info');

    // The simulator.run() method already iterates through companies.
    // Ensure the simulator is designed to run only once per test run or handle multiple calls.
    // For this example, assuming simulator.run() can be called multiple times or
    // that you'll structure your Playwright config to run projects sequentially.
    // A more robust approach would be to pass the specific company to the simulator.
    const results = await simulator.run(); 

    // Filter results for CasinoClient specifically
    const casinoclientResults = results.filter(r => r.company === 'casinoclient');

    expect(casinoclientResults.length).toBeGreaterThan(0, 'Should have tested at least one game for CasinoClient.');
    casinoclientResults.forEach(gameResult => {
      expect(gameResult.spins).toBeGreaterThan(0, `Game ${gameResult.gameName} should have simulated spins.`);
      expect(gameResult.rtp).toBeGreaterThan(0, `Game ${gameResult.gameName} should have a calculated RTP.`);
      expect(gameResult.swaggerValid).toBe(true, `Game ${gameResult.gameName} RTP should be valid against Swagger.`);
      // Add more specific assertions
    });

    log('RTP validation for CasinoClient platform completed.', 'success');
  });
});