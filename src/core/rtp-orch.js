const { getGames } = require('../utils/api-client');
const { executeSpinBatch } = require('../utils/api-client');
const { calculateRTP, calculateStats } = require('../utils/accuracy-calc');
const { validateSwagger } = require('../utils/swagger-valid');
const config = require('../../config/domains');
const thresholds = require('../../config/test-thresholds');
const { log } = require('../utils/logger');

module.exports = {
  async runValidation() {
    const companies = Object.keys(config);
    const results = [];
    
    for (const company of companies) {
      log(`Starting validation for ${company}`, 'info');
      const games = await getGames(company);
      
      for (const game of games) {
        const startTime = Date.now();
        const spinResults = await this.executeGameTest(company, game);
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
  },
  
  async executeGameTest(company, game) {
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
};