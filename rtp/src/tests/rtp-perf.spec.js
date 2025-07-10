import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: 'rtp/.env' });

import RTPStatistics from '../src/core/rtp-stats.js';
import ApiClient from '../../api/src/clients/api-client.js';
import { log } from '../src/utils/logger.js';

const SNAPSHOT_INTERVAL = 100;
const NUM_SPINS_TO_SIMULATE = parseInt(process.env.RTP_TEST_SPINS || '5000', 10);
const BET_AMOUNT = 10;

const platforms = [
  {
    name: 'playtest',
    baseURL: process.env.PLAY_TEST_API_BASE_URL,
    gameId: 'slot-game-001',
    clientId: 'playtest-client-rpt',
    username: process.env.PLAY_TEST_USERNAME,
    password: process.env.PLAY_TEST_PASSWORD
  },
  {
    name: 'casinoclient',
    baseURL: process.env.CASINO_CLIENT_API_BASE_URL,
    gameId: 'blackjack-001',
    clientId: 'casinoclient-client-rpt',
    username: process.env.CASINO_CLIENT_USERNAME,
    password: process.env.CASINO_CLIENT_PASSWORD
  }
];

for (const platform of platforms) {
  test.describe(`🎯 RTP Performance Audit: ${platform.name}`, () => {
    let rtpStatistics;
    let apiClient;

    test.beforeAll(async () => {
      rtpStatistics = new RTPStatistics({
        targetRTP: 96.0,
        tolerance: 0.5,
        minSampleSize: 100,
        criticalToleranceFactor: 2
      });

      apiClient = new ApiClient({
        baseURL: platform.baseURL,
        clientId: platform.clientId,
        username: platform.username,
        password: platform.password
      });

      await apiClient.login();
      await apiClient.startGameSession(platform.gameId);
      log(`Session started for ${platform.gameId}`, 'success');
    });

    test.beforeEach(() => {
      rtpStatistics.reset();
    });

    test(`📊 Run ${NUM_SPINS_TO_SIMULATE} rounds and audit RTP`, async () => {
      let processedRounds = 0;

      while (processedRounds < NUM_SPINS_TO_SIMULATE) {
        try {
          const betResult = await apiClient.placeBet(platform.gameId, BET_AMOUNT);
          let payout = betResult.payout || 0;

          if (betResult.requiresPayoutProcessing && betResult.transactionId) {
            const payoutResult = await apiClient.processPayout(betResult.transactionId);
            payout = payoutResult.payout;
          }

          rtpStatistics.addGameRound({
            betAmount: BET_AMOUNT,
            payout,
            gameId: platform.gameId,
            clientId: platform.clientId,
            timestamp: new Date().toISOString()
          });

          processedRounds++;
          if (processedRounds % SNAPSHOT_INTERVAL === 0) {
            rtpStatistics.snapshotRTP();
            log(`Snapshot at ${processedRounds}: RTP = ${rtpStatistics.getCurrentCumulativeRTP().toFixed(2)}%`, 'debug');
          }

        } catch (err) {
          log(`Round ${processedRounds + 1} failed: ${err.message}`, 'error');
        }
      }

      const final = rtpStatistics.generateReport();
      log(`✅ Rounds: ${final.totalRoundsSimulated}`, 'info');
      log(`🎯 Target RTP: ${final.overallTargetRTP.toFixed(2)}%`, 'info');
      log(`📈 Actual RTP: ${final.finalOverallActualRTP.toFixed(2)}%`, 'info');
      log(`⚠️  Critical Errors: ${final.criticalErrorCount}`, final.criticalErrorCount > 0 ? 'warn' : 'success');

      expect(final.totalRoundsSimulated).toBeGreaterThanOrEqual(NUM_SPINS_TO_SIMULATE);
      expect(final.isFinalOverallRTPValid).toBe(true);
      expect(final.criticalErrorCount).toBe(0);
    });
  });
}
