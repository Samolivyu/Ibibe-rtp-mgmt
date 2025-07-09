// rtp/src/scripts/data.js
import dotenv from 'dotenv';
dotenv.config();

import { log, logError } from '../utils/logger.js';
import { executeSpinBatch } from '../../api/src/utils/api-client.js';

class APIDataSource {
  constructor(config) {
    this.company = config.company;
    this.gameId = config.gameId;
    this.totalSpins = config.totalSpins;
    this.batchSize = config.batchSize;
    this.currentSpinCount = 0;
    this.gameRounds = [];

    log(`API Source Setup: ${this.company} | Game: ${this.gameId} | Total Spins: ${this.totalSpins}`, 'info');
  }

  async fetchGameRounds() {
    log(`Starting game data fetch for ${this.gameId}...`, 'info');

    while (this.currentSpinCount < this.totalSpins) {
      try {
        const spinsToFetch = Math.min(this.batchSize, this.totalSpins - this.currentSpinCount);
        const batchResult = await executeSpinBatch({
          company: this.company,
          gameId: this.gameId,
          spins: spinsToFetch,
          clientId: `${this.company}-client-api`,
          betAmount: 1
        });

        if (batchResult && Array.isArray(batchResult.rounds)) {
          this.gameRounds.push(...batchResult.rounds);
          this.currentSpinCount += batchResult.rounds.length;
          log(`Fetched ${batchResult.rounds.length} rounds. Total so far: ${this.currentSpinCount}`, 'debug');
        } else {
          throw new Error('Invalid response structure from API');
        }
      } catch (error) {
        logError(error, `Batch fetch failed at ${this.currentSpinCount} spins`);
        break;
      }
    }

    log(`Total rounds fetched for ${this.gameId}: ${this.gameRounds.length}`, 'success');
    return this.gameRounds;
  }
}

export default APIDataSource;
