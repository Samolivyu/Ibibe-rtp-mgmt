// tests/rtp-valid.spec.js
// This file runs RTP validation for games, now supporting multiple authenticated platforms,
// fetching games via API, and includes placeholders for actual game play automation.

import { test, expect } from '@playwright/test';
// Ensure all local imports have .js extension for ES Module compatibility
import { calculateRTP } from '../utils/accuracy-calc.js'; 
import { log, logError } from '../utils/logger.js';     
import domainsConfig from '../config/domains.js';       // Import as default
import thresholds from '../config/test-thresholds.js';  // Assuming this file also exports default

// Use test.describe.configure() for common settings for the whole test file
test.describe.configure({ mode: 'parallel' }); // Run tests in parallel across projects/files

test.describe('RTP Validation Suite', () => {  

  // The 'project' fixture tells us which Playwright project (e.g., 'playtest', 'casinoclient')
  // is currently running this test file.
  // We include 'page' for browser interaction and 'request' for API calls.
  test(`Validate games RTP for current platform`, async ({ request, page }, testInfo) => {
    const companyKey = testInfo.project.name; 
    const companyConfig = domainsConfig[companyKey];

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
        const fullApiUrl = `${apiBaseUrl}${gameListEndpoint}`;

        log(`Attempting to fetch games from API: ${fullApiUrl} for ${companyConfig.companyName} (authenticated)`, 'info');

        // Use Playwright's request fixture for authenticated API call.
        // It automatically uses the 'storageState' loaded by the current project.
        const response = await request.get(fullApiUrl, {
          headers: {
            ...headers, // Include any platform-specific headers from domainsConfig
            // If your API requires a specific Authorization header (e.g., Bearer token),
            // you'd need to extract that token during login (if available in a response or local storage)
            // and pass it here. For cookie-based auth handled by storageState, this might not be needed.
          },
          timeout: validation.timeout,
        });

        // Log full response for debugging if status is not OK
        if (!response.ok()) {
            const errorBody = await response.text();
            console.error(`API response was not OK (${response.status()}) for ${fullApiUrl}: ${errorBody}`);
            throw new Error(`API failed to return OK status: ${response.status()} - ${errorBody}`);
        }

        const responseData = await response.json();
        log(`Response status from game list API: ${response.status()}`, 'debug');
        log(`Response data keys from game list API: ${Object.keys(responseData)}`, 'debug');
        log(`Full response from game list API for ${companyConfig.companyName}: ${JSON.stringify(responseData, null, 2)}`, 'debug');

        // --- IMPORTANT: Adjust this game extraction logic based on YOUR API's ACTUAL response structure ---
        // This is the part that needs to correctly parse the JSON you get from the API.
        if (responseData && responseData.games) {
          games = responseData.games; // If response is { games: [...] }
        } else if (Array.isArray(responseData)) {
          games = responseData; // If response is directly [...]
        } else if (responseData.data && Array.isArray(responseData.data)) {
          games = responseData.data; // If response is { data: [...] }
        } else {
          const errorMsg = `Invalid games response format for ${companyConfig.companyName}. API Response: ${JSON.stringify(responseData, null, 2)}`;
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
      
      // Skip the test if API fetching fails critically (e.g., 404, timeout, auth)
      if (error.message.includes('404')) {
        test.skip(`Skipping ${companyConfig.companyName} - API endpoint not found (404). Check configuration.`);
      } else if (error.message.includes('timeout')) {
        test.skip(`Skipping ${companyConfig.companyName} - API timeout. Service may be unavailable.`);
      } else if (error.message.includes('status: 401') || error.message.includes('status: 403')) { // Common auth errors
        test.skip(`Skipping ${companyConfig.companyName} - API authentication failed.`);
      } else {
        throw error; // Re-throw other unexpected errors
      }
    }
    
    // Determine how many games to test (e.g., from env or config, or limited for quick runs)
    const numberOfGamesToTest = parseInt(process.env.TEST_GAME_COUNT || '2'); // Default to 2 games for quick runs
    const gamesToTest = games.slice(0, Math.min(numberOfGamesToTest, games.length));

    // Iterate through games fetched from the API and play them
    for (const game of gamesToTest) {
      await test.step(`Validate RTP for ${companyConfig.companyName} - ${game.name || game.id} (${game.id})`, async () => {
        try {
          const totalSpins = thresholds.rtp.spinsPerGame || 1000;
          log(`Starting RTP validation for ${companyConfig.companyName} - ${game.name || game.id} with ${totalSpins} spins`, 'info');

          // Construct the game URL. This is crucial and depends on your platform's URL structure.
          // Example: https://platform.com/games/game_id or https://platform.com/launch?gameId=${game.id}
          // Make sure 'game.id', 'game.slug', or 'game.code' matches the property from your API response
          const gamePageUrl = `${companyConfig.gameBaseUrl}/games/${game.id || game.slug || game.code}`; 
          
          log(`Navigating to game URL: ${gamePageUrl}`);
          await page.goto(gamePageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }); // Increase timeout if games load slowly

          // Optional: Add assertions to ensure the game loaded successfully
          await expect(page.locator('body')).not.toContainText('Error', { timeout: 10000 }); // Check for "Error" on the page
          await page.screenshot({ path: path.join(debugScreenshotDir, `${companyKey}-${game.id}-game-loaded.png`) });

          const results = [];
          const betAmount = 1; // Example fixed bet amount. You might get this from config or game UI.

          // --- IMPORTANT: REPLACE THIS LOOP WITH YOUR ACTUAL PLAYWRIGHT UI INTERACTION FOR EACH SPIN ---
          // This is the core automation for playing the game.
          for (let i = 0; i < totalSpins; i++) {
              // Example Playwright actions:
              // 1. Wait for a "Spin" or "Bet" button to be enabled:
              //    await page.waitForSelector('#spinButton:not([disabled])', { timeout: 10000 });
              // 2. Click the bet amount selector (if variable bets):
              //    await page.click(`#betAmount_${betAmount}`);
              // 3. Click the "Spin" button:
              //    await page.click('#spinButton');
              // 4. Wait for the game animation to complete or results to appear:
              //    await page.waitForSelector('.win-amount-display', { state: 'visible', timeout: 15000 });
              // 5. Extract bet and win amounts from the UI:
              //    const currentBet = parseFloat(await page.textContent('#currentBetDisplay'));
              //    const winAmount = parseFloat(await page.textContent('.win-display'));
              //    results.push({ bet: currentBet, win: winAmount });
              // 6. Add small delays if needed to simulate human interaction or avoid overwhelming the game:
              //    await page.waitForTimeout(500);

              // For now, continue simulating spins for demonstration:
              const simulatedWin = Math.random() > 0.5 ? betAmount * 1.5 : 0; // Simple win/loss simulation
              results.push({ bet: betAmount, win: simulatedWin });
              await page.waitForTimeout(50); // Small delay to simulate game
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
