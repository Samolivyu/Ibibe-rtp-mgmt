import dotenv from 'dotenv';
dotenv.config();

import { log } from '../../../api/src/utils/logger.js';
import APIDataSource from './data.js';
import { getGames } from '../../api/src/utils/api-client.js';
import RTPStatistics from '../core/rtp-stats.js';
import thresholds from '../config/test-thresholds.js';

const NUM_SPINS = parseInt(process.env.RTP_TEST_SPINS || '1000', 10);
const BATCH_SIZE = parseInt(process.env.RTP_BATCH_SIZE || '100', 10);

/**
 * Executes RTP collection and prints final report
 * @param {string} company - 'playtest' or 'casinoclient'
 * @param {string} gameId
 */
export async function runRTPAudit(company, gameId) {
  log(`Initiating RTP Audit for company: ${company}, game: ${gameId}`, 'info');

  // Initialize statistics engine
  const rtpStats = new RTPStatistics({
    overallTargetRTP: thresholds.rtp.targetRTP,
    overallTolerance: thresholds.rtp.tolerance,
    criticalToleranceFactor: 2,
    minRoundsForRTPValidation: thresholds.rtp.minSampleSize,
    maxLosingStreak: thresholds.rtp.maxLosingStreak || 50
  });

  // Fetch simulated spins in batches
  const apiSource = new APIDataSource({ company, gameId, totalSpins: NUM_SPINS, batchSize: BATCH_SIZE });
  const rounds = await apiSource.fetchGameRounds();

  // Add each round to stats
  for (const round of rounds) {
    rtpStats.addGameRound(round);
  }

  // Generate and log the final report
  const report = rtpStats.generateReport();
  log(`\n== Final Report for ${company} (${gameId}) ==`, 'info');
  log(`Total Rounds: ${report.totalRoundsSimulated}`, 'info');
  log(`Actual RTP: ${report.finalOverallActualRTP.toFixed(2)}%`, 'info');
  log(`Target RTP: ${report.overallTargetRTP.toFixed(2)}%`, 'info');
  log(`Deviation: ${report.finalOverallDeviation.toFixed(2)}%`, 'info');
  log(
    `Valid RTP? ${report.isFinalOverallRTPValid ? 'YES' : 'NO'}`,
    report.isFinalOverallRTPValid ? 'success' : 'error'
  );
}

/**
 * Parses command-line arguments and kicks off the RTP audit.
 */
async function main() {
  const [, , companyArg, gameIdArg] = process.argv;
  if (!companyArg) {
    console.error('Usage: node rtp-index.js <playtest|casinoclient> [gameId]');
    process.exit(1);
  }

  const company = companyArg;
  let gameId = gameIdArg;

  // If no gameId provided, fetch the first available
  if (!gameId) {
    try {
      const games = await getGames(company);
      if (!Array.isArray(games) || games.length === 0) {
        console.error(`No games found for company "${company}". Exiting.`);
        process.exit(1);
      }
      gameId = games[0].id;
    } catch (err) {
      console.error(`Failed to fetch games for "${company}": ${err.message}`);
      process.exit(1);
    }
  }

  try {
    await runRTPAudit(company, gameId);
  } catch (err) {
    console.error(`RTP audit failed: ${err.message}`);
    process.exit(1);
  }
}

// Only invoke main if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}