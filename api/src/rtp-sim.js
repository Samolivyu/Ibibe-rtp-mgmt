// /api/src/rtp-sim.js
import { log, logError } from './utils/logger.js';
import { loginUser, getGames, createSession, executeSpinBatch, getUserRTP, generateGameUrl } from './utils/api-client.js';
import config from '../config/domains.js';
import thresholds from '../config/test-thresholds.js';
import RTPCalculator from '../../rtp/src/core/rtp-calc.js'; // Your provided RTPCalculator
import { validateSwagger } from './utils/swagger-valid.js'; // Assuming this exists

class RTPSimulator {
  constructor() {
    this.validationResults = [];
    log('RTP Simulator initialized.', 'info');
  }

  async run() {
    log('Starting Full RTP Audit Simulation...', 'info');
    try {
      for (const companyKey of Object.keys(config)) {
        const companyConfig = config[companyKey];
        log(`\n--- Starting simulation for ${companyConfig.companyName} ---`, 'info');

        // 1. Authentication
        let authResult;
        try {
          authResult = await loginUser(companyKey, companyConfig.username, companyConfig.password);
          log(`Successfully authenticated with ${companyConfig.companyName} as ${companyConfig.username}.`, 'success');
        } catch (authError) {
          logError(authError, `Authentication failed for ${companyConfig.companyName}. Skipping platform.`);
          continue; // Skip this platform if authentication fails
        }

        // 2. Game Discovery
        const games = await getGames(companyKey);
        if (!games || games.length === 0) {
          log(`No games found for ${companyConfig.companyName}. Skipping game validation.`, 'warn');
          continue;
        }
        log(`Found ${games.length} games for ${companyConfig.companyName}.`, 'info');

        // 3. Iterate and Test Each Game
        for (const game of games) {
          log(`\n--- Testing Game: ${game.name} (${game.id}) on ${companyConfig.companyName} ---`, 'info');
          const startTime = Date.now();
          let spinResults = [];
          let sessionUrl = null;

          try {
            // 3.1 Create Game Session (if applicable)
            const sessionData = await createSession(
              companyKey,
              authResult.userId,
              game.id,
              companyConfig.currency
            );
            sessionUrl = sessionData.sessionUrl;
            log(`Game session created for ${game.name}.`, 'success');
            // Optional: If you need to launch the game in a browser for UI interaction,
            // you would use sessionUrl here with Playwright.
            // For API-driven RTP, we proceed to executeSpinBatch directly.

            // 3.2 Simulate Spins (API-driven)
            log(`Simulating ${thresholds.rtp.spinsPerGame} spins for ${game.name}...`, 'info');
            const totalSpinsToSimulate = thresholds.rtp.spinsPerGame;
            const batchSize = thresholds.rtp.batchSize;

            for (let i = 0; i < totalSpinsToSimulate; i += batchSize) {
              const currentBatchSize = Math.min(batchSize, totalSpinsToSimulate - i);
              const batchResults = await executeSpinBatch({
                company: companyKey,
                gameId: game.id,
                clientId: authResult.userId,
                betAmount: 1, // Default bet amount, adjust as needed
                spins: currentBatchSize
              });
              spinResults.push(...batchResults);
              log(`  Processed ${spinResults.length} / ${totalSpinsToSimulate} spins.`, 'debug');
            }
            log(`Finished simulating ${spinResults.length} spins for ${game.name}.`, 'success');

          } catch (gameTestError) {
            logError(gameTestError, `Game test failed for ${game.name} on ${companyConfig.companyName}.`);
            // Continue to next game or platform if a game fails
            this.validationResults.push({
              company: companyKey,
              gameId: game.id,
              gameName: game.name,
              spins: spinResults.length,
              rtp: 0, // Indicate failure
              stats: {},
              swaggerValid: false,
              duration: Date.now() - startTime,
              error: gameTestError.message
            });
            continue; // Skip to next game
          }

          // 3.3 Calculate RTP
          const calculatedRTP = RTPCalculator.calculateRTP(spinResults); // Use static method
          log(`Calculated RTP for ${game.name}: ${calculatedRTP.toFixed(2)}%`, 'info');

          // 3.4 Validate against Swagger
          let swaggerValid = false;
          try {
            swaggerValid = await validateSwagger(companyKey, game.id, calculatedRTP);
          } catch (swaggerError) {
            logError(swaggerError, `Swagger validation failed for ${game.name}.`);
            swaggerValid = false;
          }

          // 3.5 Fetch User RTP (if applicable and needed for comparison)
          let userRTPFromAPI = null;
          try {
            userRTPFromAPI = await getUserRTP(companyKey, authResult.userId, game.id);
            log(`User RTP from API for ${game.name}: ${userRTPFromAPI.rtp.toFixed(2)}%`, 'info');
          } catch (userRTPError) {
            logError(userRTPError, `Failed to fetch user RTP for ${game.name}.`);
          }

          // Store results
          this.validationResults.push({
            company: companyKey,
            gameId: game.id,
            gameName: game.name,
            spins: spinResults.length,
            rtp: calculatedRTP,
            stats: RTPCalculator.calculateStats(spinResults), // Assuming calculateStats is also static or accessible
            swaggerValid,
            userRTPFromAPI: userRTPFromAPI ? userRTPFromAPI.rtp : 'N/A',
            duration: Date.now() - startTime
          });
        }
      }
      log('\nFull RTP Audit Simulation Completed.', 'success');
      return this.validationResults;

    } catch (error) {
      logError(error, 'RTP Simulator Fatal Error');
      throw error;
    }
  }

  getResults() {
    return this.validationResults;
  }
}

export default RTPSimulator;