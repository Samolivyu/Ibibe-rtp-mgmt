//rtp/src/tests/rtp-valid.spec.js

import { test, expect } from '@playwright/test';
import { calculateRTP } from '../../rtp/src/core/rtp-calc.js';
import { log } from '../utils/logger.js';

test.describe('RTP Validation', () => {
  test('should calculate RTP for platform games', async ({ page }, testInfo) => {
    const companyKey = testInfo.project.name;
    const companyConfig = testInfo.project.use.companyConfig;
    const spins = testInfo.project.metadata.rtpSpins;
    const batchSize = testInfo.project.metadata.rtpBatchSize;
    
    log(`Starting RTP validation for ${companyKey} - ${spins} spins`);
    
    // Fetch game list from API
    const games = await page.evaluate(async (apiBaseUrl) => {
      const response = await fetch(`${apiBaseUrl}/games`);
      return response.json();
    }, companyConfig.apiBaseUrl);
    
    const rtpResults = [];
    
    for (const game of games) {
      log(`Testing game: ${game.name} (${game.id})`);
      const gameResults = {
        gameId: game.id,
        gameName: game.name,
        spins: [],
        rtp: 0
      };
      
      // Execute spins in batches
      for (let i = 0; i < spins; i += batchSize) {
        const currentBatch = Math.min(batchSize, spins - i);
        const batchResults = await page.evaluate(async (batch) => {
          const results = [];
          for (let j = 0; j < batch.size; j++) {
            const spin = await fetch(`${batch.baseUrl}/games/${batch.gameId}/spin`);
            results.push(await spin.json());
          }
          return results;
        }, {
          baseUrl: companyConfig.apiBaseUrl,
          gameId: game.id,
          size: currentBatch
        });
        
        gameResults.spins.push(...batchResults);
      }
      
      // Calculate RTP
      gameResults.rtp = calculateRTP(gameResults.spins);
      rtpResults.push(gameResults);
      log(`Game ${game.name} RTP: ${gameResults.rtp.toFixed(2)}%`);
    }
    
    // Save results for reporting
    testInfo.attach('rtp-results', {
      body: JSON.stringify(rtpResults),
      contentType: 'application/json'
    });
    
    // Validate against Swagger
    const swaggerValid = await validateAgainstSwagger(page, companyConfig, rtpResults);
    expect(swaggerValid, 'RTP values should match Swagger documentation').toBeTruthy();
  });
});

async function validateAgainstSwagger(page, config, results) {
  return page.evaluate(async (config, results) => {
    const swagger = await fetch(config.swaggerUrl).then(r => r.json());
    
    return results.every(game => {
      const expectedRTP = findExpectedRTP(swagger, game.gameId);
      return Math.abs(game.rtp - expectedRTP) <= 0.5; // 0.5% tolerance
    });
  }, config, results);
}