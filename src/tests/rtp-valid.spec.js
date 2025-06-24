const { test, expect } = require('@playwright/test');
const { getGames, executeSpinBatch } = require('../utils/api-client');
const { calculateRTP } = require('../utils/accuracy-calc');
const { log, logError } = require('../utils/logger');
const config = require('../../config/domains');
const thresholds = require('../../config/test-thresholds');

test.describe('RTP Validation Suite', () => {  
  const companies = Object.keys(config);

  for (const company of companies) {
    test(`Validate ${company} games RTP`, async ({ }, testInfo) => {
      testInfo.setTimeout(thresholds.execution.gameTimeout * 2);
      
      let games = [];
      
      try {
        // Test connection and get games
        await test.step(`Fetch games for ${company}`, async () => {
          games = await getGames(company);
          expect(games).toBeDefined();
          expect(games.length).toBeGreaterThan(0);
          
          testInfo.annotations.push({
            type: 'Games count',
            description: `${games.length} games found for ${company}`
          });
          
          log(`Successfully fetched ${games.length} games for ${company}`, 'success');
        });
      } catch (error) {
        // If we can't get games, skip this company but log the issue
        logError(error, `Failed to fetch games for ${company}`);
        testInfo.annotations.push({
          type: 'Error',
          description: `Failed to fetch games: ${error.message}`
        });
        
        // Check if it's a configuration issue
        if (error.message.includes('404')) {
          test.skip(`Skipping ${company} - API endpoint not found (404). Check configuration.`);
        } else if (error.message.includes('timeout')) {
          test.skip(`Skipping ${company} - API timeout. Service may be unavailable.`);
        } else {
          throw error; // Re-throw other errors
        }
      }
      
      // Test first 2 games for demo (or all if less than 2)
      const gamesToTest = games.slice(0, Math.min(2, games.length));
      
      for (const game of gamesToTest) {
        await test.step(`Validate RTP for ${game.name || game.id} (${game.id})`, async () => {
          try {
            // Execute spins in batches
            const batches = [];
            const batchSize = thresholds.rtp.batchSize || 100;
            const totalSpins = thresholds.rtp.spinsPerGame || 1000;
            
            log(`Starting RTP validation for ${game.name || game.id} with ${totalSpins} spins`, 'info');
            
            for (let i = 0; i < totalSpins; i += batchSize) {
              const currentBatchSize = Math.min(batchSize, totalSpins - i);
              batches.push(executeSpinBatch(company, game.id, currentBatchSize));
            }
            
            const results = (await Promise.all(batches)).flat();
            
            // Filter out failed spins
            const validResults = results.filter(result => !result.error);
            const failedSpins = results.length - validResults.length;
            
            if (failedSpins > 0) {
              log(`${failedSpins} out of ${results.length} spins failed for ${game.name || game.id}`, 'warn');
            }
            
            expect(validResults.length).toBeGreaterThan(0);
            
            const rtp = calculateRTP(validResults);
            const rtpPercentage = (rtp * 100).toFixed(2);
            
            // Validate against thresholds
            const warningThreshold = thresholds.rtp.warningThreshold || 0.85;
            const upperThreshold = 1 + (1 - warningThreshold); // e.g., if warning is 0.85, upper is 1.15
            
            expect(rtp).toBeGreaterThanOrEqual(warningThreshold);
            expect(rtp).toBeLessThanOrEqual(upperThreshold);
            
            // Add to test annotations
            testInfo.annotations.push({
              type: 'RTP Result',
              description: `${game.name || game.id}: ${rtpPercentage}% (${validResults.length}/${results.length} valid spins)`
            });
            
            log(`RTP validation passed for ${game.name || game.id}: ${rtpPercentage}%`, 'success');
            
          } catch (error) {
            logError(error, `RTP validation failed for ${game.name || game.id}`);
            testInfo.annotations.push({
              type: 'Game Error',
              description: `${game.name || game.id}: ${error.message}`
            });
            throw error;
          }
        });
      }
    });
  }
});