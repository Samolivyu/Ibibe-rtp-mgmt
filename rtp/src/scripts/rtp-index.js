// rtp/src/scripts/rtp-index.js
import dotenv from 'dotenv';
dotenv.config();

import { log } from '../utils/logger.js';
import APIDataSource from './data.js';
import RTPStatistics from '../core/rtp-stats.js';
import thresholds from '../config/test-thresholds.js';

const NUM_SPINS = parseInt(process.env.RTP_TEST_SPINS || 1000, 10);
const BATCH_SIZE = parseInt(process.env.RTP_BATCH_SIZE || 100, 10);

/**
 * Executes RTP collection and prints final report
 * @param {string} company - Either 'playtest' or 'casinoclient'
 * @param {string} gameId
 */
async function runRTPAudit(company, gameId) {
  log(`Initiating RTP Audit for company: ${company}, game: ${gameId}`, 'info');

  const rtpStats = new RTPStatistics({
    overallTargetRTP: thresholds.rtp.targetRTP,
    overallTolerance: thresholds.rtp.tolerance,
    criticalToleranceFactor: 2,
    minRoundsForRTPValidation: thresholds.rtp.minSampleSize,
    maxLosingStreak: 50
  });

  const apiSource = new APIDataSource({
    company,
    gameId,
    totalSpins: NUM_SPINS,
    batchSize: BATCH_SIZE
  });

  const rounds = await apiSource.fetchGameRounds();
  rounds.forEach(round => rtpStats.addGameRound(round));
  const report = rtpStats.generateReport();

  log(`\n== Final Report for ${company} (${gameId}) ==`, 'info');
  log(`Total Rounds: ${report.totalRoundsSimulated}`);
  log(`Actual RTP: ${report.finalOverallActualRTP.toFixed(2)}%`);
  log(`Target RTP: ${report.overallTargetRTP.toFixed(2)}%`);
  log(`Deviation: ${report.finalOverallDeviation.toFixed(2)}%`);
  log(`Valid RTP? ${report.isFinalOverallRTPValid ? 'YES' : 'NO'}`, report.isFinalOverallRTPValid ? 'success' : 'error');
}

if (process.argv[1] === import.meta.url) {
  const company = process.argv[2];
  const gameId = process.argv[3];

  if (!company || !gameId) {
    console.log('Usage: node rtp-index.js <playtest|casinoclient> <gameId>');
    process.exit(1);
  }

  runRTPAudit(company, gameId);
}

export { runRTPAudit };
