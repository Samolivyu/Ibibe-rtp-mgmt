// tests/rtp-valid.spec.js
// This file runs RTP validation for games, now supporting multiple authenticated platforms.

const { test, expect } = require('@playwright/test');
const { calculateRTP } = require('../utils/accuracy-calc'); // Assuming path from RTP/tests
const { log, logError } = require('../utils/logger');     // Assuming path from RTP/tests
const domainsConfig = require('../config/domains');       // Assuming path from RTP/tests
const thresholds = require('../config/test-thresholds');  // Assuming path from RTP/tests

// Use test.describe.configure() for common settings for the whole test file
test.describe.configure({ mode: 'parallel' }); // Run tests in parallel across projects/files

test.describe('RTP Validation Suite', () => {  

  // The 'project' fixture tells us which Playwright project (e.g., 'playtest', 'casinoclient')
  // is currently running this test file.
  test(`Validate games RTP for current platform`, async ({ request, page }, testInfo) => {
    // Get the current company key from the project name
    const companyKey = testInfo.project.name; 
    const companyConfig = domainsConfig[companyKey];

    // Skip if no configuration found for this project name
    if (!companyConfig) {
      logError(new Error(`No domain configuration found for project: ${companyKey}`), 'RTP Validation Suite');
      test.skip(`Skipping test: No configuration for project ${companyKey}`);
      return;
    }

    testInfo.setTimeout(thresholds.execution.gameTimeout * 2);
    
    let games = [];
    
    try {
      await test.step(`Fetch games for ${companyConfig.companyName} via authenticated API`, async () => {
        const { apiBaseUrl, gameListEndpoint, headers, validation } = companyConfig;
        const fullUrl = `${apiBaseUrl}${gameListEndpoint}`;

        log(`Attempting to fetch games from: ${fullUrl} for ${companyConfig.companyName} (authenticated)`, 'info');

        // Use Playwright's request fixture for authenticated API call.
        // It automatically uses the 'storageState' loaded by the current project.
        const response = await request.get(fullUrl, {
          headers: {
            ...headers, // Include any platform-specific headers from domainsConfig
          },
          timeout: validation.timeout,
        });

        // Log full response for debugging if status is not OK
        if (!response.ok()) {
            const errorBody = await response.text();
            console.error(`API response was not OK (${response.status()}) for ${fullUrl}: ${errorBody}`);
            throw new Error(`API failed to return OK status: ${response.status()} - ${errorBody}`);
        }

        const responseData = await response.json();
        log(`Response status from game list API: ${response.status()}`, 'debug');
        log(`Response data keys from game list API: ${Object.keys(responseData)}`, 'debug');
        log(`Full response from game list API for ${companyConfig.companyName}: ${JSON.stringify(responseData, null, 2)}`, 'debug');

        // --- IMPORTANT: Adjust this game extraction logic based on YOUR API's ACTUAL response structure ---
        if (responseData && responseData.games) {
          games = responseData.games;
        } else if (Array.isArray(responseData)) {
          games = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          games = responseData.data;
        } else {
          const errorMsg = `Invalid games response format for ${companyConfig.companyName}. Received: ${JSON.stringify(responseData, null, 2)}`;
          logError(new Error(errorMsg), `getGames for ${companyConfig.companyName}`);
          throw new Error(errorMsg); // Re-throw to fail the step
        }
        
        expect(games).toBeDefined();
        expect(games.length).toBeGreaterThan(0);
        
        testInfo.annotations.push({
          type: 'Games count',
          description: `${games.length} games found for ${companyConfig.companyName}`
        });
        
        log(`Successfully fetched ${games.length} games for ${companyConfig.companyName}`, 'success');
      });
    } catch (error) {
      logError(error, `Failed to fetch games for ${companyConfig.companyName}`);
      testInfo.annotations.push({
        type: 'Error',
        description: `Failed to fetch games: ${error.message}`
      });
      
      if (error.message.includes('404')) {
        test.skip(`Skipping ${companyConfig.companyName} - API endpoint not found (404). Check configuration.`);
      } else if (error.message.includes('timeout')) {
        test.skip(`Skipping ${companyConfig.companyName} - API timeout. Service may be unavailable.`);
      } else {
        throw error;
      }
    }
    
    // Test first N games as per RTP_BATCH_SIZE or a fixed number for demo
    const gamesToTestCount = parseInt(process.env.RTP_BATCH_SIZE) || 2; // Use RTP_BATCH_SIZE for count, default to 2
    const gamesToTest = games.slice(0, Math.min(gamesToTestCount, games.length));

    // Iterate through games fetched from the API
    for (const game of gamesToTest) {
      await test.step(`Validate RTP for ${companyConfig.companyName} - ${game.name || game.id} (${game.id})`, async () => {
        try {
          log(`Starting RTP validation for ${companyConfig.companyName} - ${game.name || game.id} with ${thresholds.rtp.spinsPerGame} spins`, 'info');

          // Construct the game URL. Adjust this based on how your games are accessed.
          // Example: https://platform.com/games/game_id or https://platform.com/launch?gameId=game_id
          const gamePageUrl = `${companyConfig.gameBaseUrl}/games/${game.id}`; // Common pattern, adjust as needed

          // Navigate to the game page. Playwright's 'page' fixture will use the authenticated context.
          await page.goto(gamePageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }); // Increase timeout if games load slowly

          // You might want to add assertions here to ensure the game loaded successfully
          await expect(page.locator('body')).not.toContainText('Error'); // Example: Check for error messages

          const results = [];
          const betAmount = 1; // Example fixed bet amount

          // --- IMPORTANT: Replace this loop with actual Playwright UI interaction for each spin ---
          // This is the core of your game testing automation.
          for (let i = 0; i < (thresholds.rtp.spinsPerGame || 1000); i++) { // Default to 1000 spins if not set
              // Example Playwright actions:
              // await page.click('#betButton'); // Click bet button
              // await page.waitForTimeout(500); // Wait for bet to register
              // await page.click('#spinButton'); // Click spin button
              // await page.waitForSelector('.win-amount-display', { state: 'visible', timeout: 10000 }); // Wait for result display
              // const win = parseFloat(await page.textContent('.win-amount-display')); // Get win amount
              // results.push({ bet: betAmount, win: win });

              // For now, continue simulating spins for demonstration
              const simulatedWin = Math.random() > 0.5 ? betAmount * 1.5 : 0;
              results.push({ bet: betAmount, win: simulatedWin });
              await page.waitForTimeout(50); // Small delay
          }
          // --- End of Playwright UI interaction ---
          
          const validResults = results.filter(result => !result.error);
          const failedSpins = results.length - validResults.length;
          
          if (failedSpins > 0) {
            log(`${failedSpins} out of ${results.length} spins failed for ${game.name || game.id}`, 'warn');
          }
          
          expect(validResults.length).toBeGreaterThan(0);
          
          const rtp = calculateRTP(validResults);
          const rtpPercentage = (rtp * 100).toFixed(2);
          
          const warningThreshold = thresholds.rtp.warningThreshold || 0.85; // Default warning threshold
          const upperThreshold = 1 + (1 - warningThreshold); // Upper bound for RTP check
          
          expect(rtp).toBeGreaterThanOrEqual(warningThreshold);
          expect(rtp).toBeLessThanOrEqual(upperThreshold);
          
          testInfo.annotations.push({
            type: 'RTP Result',
            description: `${game.name || game.id}: ${rtpPercentage}% (${validResults.length}/${results.length} valid spins)`
          });
          
          log(`RTP validation passed for ${game.name || game.id}: ${rtpPercentage}%`, 'success');
          
        } catch (error) {
          logError(error, `RTP validation failed for ${companyConfig.companyName} - ${game.name || game.id}`);
          testInfo.annotations.push({
            type: 'Game Error',
            description: `${game.name || game.id}: ${error.message}`
          });
          throw error;
        }
      });
    } // End of for...of gamesToTest
  }); // End of test
}); // End of describe

