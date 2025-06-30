import { getGames, executeSpinBatch } from '../utils/api-client.js';
import { calculateRTP, calculateStats } from '../utils/accuracy-calc.js';
import { validateSwagger } from '../utils/swagger-valid.js';
import config from '../../config/domains.js';
import thresholds from '../../config/test-thresholds.js';
import { log } from '../utils/logger.js';

export async function runValidation() {
  const companies = Object.keys(config);
  const results = [];
  
  for (const company of companies) {
    log(`Starting validation for ${company}`, 'info');
    const games = await getGames(company);
    
    for (const game of games) {
      const startTime = Date.now();
      const spinResults = await executeGameTest(company, game);
      const rtp = calculateRTP(spinResults);
      const stats = calculateStats(spinResults);
      const swaggerValid = validateSwagger(company, game.id, rtp);
      
      const result = {
        company,
        gameId: game.id,
        gameName: game.name,
        spins: spinResults.length,
        rtp,
        stats,
        swaggerValid,
        duration: Date.now() - startTime
      };
      
      log(`Completed ${game.name}: RTP ${(rtp * 100).toFixed(2)}% ` +
          `(Valid: ${swaggerValid ? '✅' : '❌'})`, 
          swaggerValid ? 'success' : 'warn');
          
      results.push(result);
    }
  }
  
  return results;
}

export async function executeGameTest(company, game) {
  const batches = [];
  const batchSize = thresholds.rtp.batchSize;
  const totalSpins = thresholds.rtp.spinsPerGame;
  
  // Create batches
  for (let i = 0; i < totalSpins; i += batchSize) {
    batches.push({
      company,
      gameId: game.id,
      batchSize: Math.min(batchSize, totalSpins - i)
    });
  }
  
  // Execute batches in parallel with concurrency control
  const concurrency = thresholds.execution.maxConcurrentGames;
  const results = [];
  
  while (batches.length) {
    const currentBatches = batches.splice(0, concurrency);
    const batchResults = await Promise.all(
      currentBatches.map(b => executeSpinBatch(b.company, b.gameId, b.batchSize))
    );
    results.push(...batchResults.flat());
  }
  
  return results;
}
