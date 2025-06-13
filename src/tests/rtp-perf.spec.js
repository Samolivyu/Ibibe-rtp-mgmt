// tests/rtp-performance.spec.js
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const RTPStatistics = require('../src/core/rtp-stats');
const RTPUtils = require('../tests/utils');

class MockGameDataSource {
    constructor(gameDataPath = path.join(__dirname, '../data/sample-game-data.json')) {
        this.gameData = [];
        this.currentIndex = 0;
        try {
            this.gameData = JSON.parse(fs.readFileSync(gameDataPath, 'utf8'));
            RTPUtils.log(`Loaded ${this.gameData.length} sample game rounds from ${gameDataPath}`);
        } catch (error) {
            RTPUtils.log(`Failed to load sample game data: ${error.message}. Generating random data.`, 'warn');
            // If file doesn't exist or is invalid, generate some dummy data
            this.gameData = this._generateDummyData(5000); // Generate 5000 dummy rounds
        }
    }

    // Fallback to generate dummy data if file loading fails
    _generateDummyData(numRounds) {
        const dummyData = [];
        const gameIds = ['game-slot-01', 'game-roulette-02', 'game-blackjack-03'];
        const clientIds = ['player-A', 'player-B', 'player-C'];
        const targetRTPs = {
            'game-slot-01': 96.5,
            'game-roulette-02': 97.3,
            'game-blackjack-03': 99.2
        };
        const betRange = { min: 1, max: 100 };
        const payoutVariance = 0.1;

        for (let i = 0; i < numRounds; i++) {
            const gameId = gameIds[Math.floor(Math.random() * gameIds.length)];
            const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
            const betAmount = parseFloat(RTPUtils.getRandomNumber(betRange.min, betRange.max).toFixed(2));
            
            const targetRTP = targetRTPs[gameId];
            let idealPayout = (betAmount * targetRTP) / 100;
            let payoutVar = betAmount * payoutVariance * RTPUtils.getRandomNumber(-1, 1);
            let payout = parseFloat((idealPayout + payoutVar).toFixed(2));
            if (payout < 0) payout = 0; // Payout cannot be negative

            dummyData.push({
                betAmount,
                payout,
                gameId,
                clientId,
                timestamp: new Date().toISOString()
            });
        }
        return dummyData;
    }

    /**
     * Simulates fetching a single game round.
     * @returns {object|null} The next game round, or null if no more data.
     */
    fetchNextGameRound() {
        if (this.currentIndex < this.gameData.length) {
            const round = this.gameData[this.currentIndex];
            this.currentIndex++;
            return round;
        }
        return null; // No more data
    }

    /**
     * Resets the data source index.
     */
    reset() {
        this.currentIndex = 0;
    }

    /**
     * Returns the total number of available game rounds.
     * @returns {number}
     */
    getTotalRounds() {
        return this.gameData.length;
    }
}

test.describe('RTP Performance and Accuracy Audit (Enhanced)', () => 
{
    const NUM_SPINS_TO_SIMULATE = 5000;
    const SNAPSHOT_INTERVAL = 100;

    let rtpStatistics; // Only need RTPStatistics for this high-level test
    let mockDataSource; // Declare at test suite level

    test.beforeAll(async () => {
        // Initialize RTPStatistics with game-specific targets and anomaly thresholds
        rtpStatistics = new RTPStatistics({
            overallTargetRTP: 96.0,
            overallTolerance: 0.5,
            criticalToleranceFactor: 2, // 2x tolerance deviation is critical
            minRoundsForRTPValidation: 100,
            maxLosingStreak: 50, // Flag a losing streak over 50
            gameSpecificRTPs: { // Define expected RTP for specific games
                'game-slot-01': 96.5,
                'game-roulette-02': 97.3,
                'game-blackjack-03': 99.2
            }
        });

        // Initialize data source (tries to load from file, then generates dummy)
        // Ensure this mockDataSource can load data with gameId and clientId
        // For real testing, this would be integrated with the API client from your colleague.
        // Example: const apiClient = new ApiClient(...);
        // Then, in the loop: const gameRound = await apiClient.placeBetAndGetResult(...);
        mockDataSource = new MockGameDataSource(); // Remove 'this.' prefix
        if (mockDataSource.getTotalRounds() < NUM_SPINS_TO_SIMULATE) {
            RTPUtils.log(`Warning: Sample data has ${mockDataSource.getTotalRounds()} rounds. Simulating up to ${NUM_SPINS_TO_SIMULATE} rounds by extending dummy data.`, 'warn');
            // If generating dummy data, ensure gameId/clientId are included
        }
    });

    test.beforeEach(() => {
        rtpStatistics.reset();
        mockDataSource.reset(); // Reset for each test
    });

    test(`should simulate ${NUM_SPINS_TO_SIMULATE} game spins, audit RTP, and detect anomalies`, async () => 
    {
        RTPUtils.log(`Starting enhanced RTP audit for ${NUM_SPINS_TO_SIMULATE} spins...`);
        let processedRounds = 0;

        while (processedRounds < NUM_SPINS_TO_SIMULATE) 
        {
            const gameRound = mockDataSource.fetchNextGameRound();
            if (!gameRound) {
                RTPUtils.log(`No more game data from source after ${processedRounds} rounds.`, 'info');
                break;
            }

            // This is where real API interaction would occur in a full E2E test:
            // const apiResult = await apiClient.placeBet(gameRound.betAmount, gameRound.gameId, gameRound.clientId);
            // const actualGameRound = { ...gameRound, payout: apiResult.payout }; // Use actual payout from API
            // rtpStatistics.addGameRound(actualGameRound);

            // For now, use the mock/sample data
            rtpStatistics.addGameRound(gameRound);
            processedRounds++;

            if (processedRounds % SNAPSHOT_INTERVAL === 0) {
                rtpStatistics.snapshotRTP(); // This will now snapshot overall, per-game, per-client RTPs
                RTPUtils.log(`Round ${processedRounds}: Overall RTP = ${rtpStatistics.getCurrentCumulativeRTP().toFixed(2)}%`);
            }
        }

        const finalReport = rtpStatistics.generateReport();
        RTPUtils.log('\n--- RTP Audit Final Report (Enhanced) ---');
        RTPUtils.log(`Total Simulated Rounds: ${finalReport.totalRoundsSimulated}`);
        RTPUtils.log(`Overall Target RTP: ${finalReport.overallTargetRTP.toFixed(2)}%`);
        RTPUtils.log(`Final Overall Actual RTP: ${finalReport.finalOverallActualRTP.toFixed(2)}%`);
        RTPUtils.log(`Final Overall Deviation: ${finalReport.finalOverallDeviation.toFixed(2)}%`);
        RTPUtils.log(`Is Final Overall RTP within Tolerance (${finalReport.overallTolerance}%): ${finalReport.isFinalOverallRTPValid ? 'YES' : 'NO'}`);
        RTPUtils.log(`Critical Anomalies Detected: ${finalReport.criticalErrorCount}`);

        // Log detailed critical errors if any for the report
        if (finalReport.criticalErrorCount > 0) 
        {
            RTPUtils.log('\n--- Critical Anomaly Details ---', 'error');
            finalReport.criticalErrorsDetails.forEach((error, index) => {
                RTPUtils.log(`${index + 1}. [${error.type}] Round: ${error.roundCount}, Message: ${error.message}`, 'error');
            });
        }

        RTPUtils.log('\n--- Per-Game Summary ---');
        for (const gameId in finalReport.perGameSummary) 
        {
            const summary = finalReport.perGameSummary[gameId];
            RTPUtils.log(`  Game: ${gameId}, Rounds: ${summary.rounds}, Actual RTP: ${summary.actualRTP}, Target RTP: ${summary.targetRTP}, Current Losing Streak: ${summary.losingStreak}`);
        }

        RTPUtils.log('\n--- Per-Client Summary ---');
        for (const clientId in finalReport.perClientSummary) 
        {
            const summary = finalReport.perClientSummary[clientId];
            RTPUtils.log(`  Client: ${clientId}, Rounds: ${summary.rounds}, Actual RTP: ${summary.actualRTP}, Current Losing Streak: ${summary.losingStreak}`);
        }
        RTPUtils.log('--- End of Report ---');

        // Assertions:
        expect(finalReport.totalRoundsSimulated).toBeGreaterThanOrEqual(processedRounds);
        expect(finalReport.isFinalOverallRTPValid).toBe(true, `Overall RTP (${finalReport.finalOverallActualRTP.toFixed(2)}%) outside tolerance.`);
        expect(finalReport.criticalErrorCount).toBe(0, `Found ${finalReport.criticalErrorCount} critical anomalies. Review details.`);

        // Further specific assertions can be added here, e.g.:
        // expect(finalReport.perGameSummary['game-slot-01'].isWithinTolerance).toBe(true);
        // expect(finalReport.perClientSummary['player-alpha'].criticalLosingStreaksDetected).toBe(0);
    });
 });   

    // Fallback to generate dummy data if file loading fails
    _generateDummyData(numRounds) 
    {
        const dummyData = [];
        const gameIds = ['game-slot-01', 'game-roulette-02', 'game-blackjack-03'];
        const clientIds = ['player-A', 'player-B', 'player-C'];
        const targetRTPs = {
            'game-slot-01': 96.5,
            'game-roulette-02': 97.3,
            'game-blackjack-03': 99.2
        };
        const betRange = { min: 1, max: 100 };
        const payoutVariance = 0.1;

        for (let i = 0; i < numRounds; i++) {
            const gameId = gameIds[Math.floor(Math.random() * gameIds.length)];
            const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
            const betAmount = parseFloat(RTPUtils.getRandomNumber(betRange.min, betRange.max).toFixed(2));
            
            const targetRTP = targetRTPs[gameId];
            let idealPayout = (betAmount * targetRTP) / 100;
            let payoutVar = betAmount * payoutVariance * RTPUtils.getRandomNumber(-1, 1);
            let payout = parseFloat((idealPayout + payoutVar).toFixed(2));
            if (payout < 0) payout = 0; // Payout cannot be negative

            dummyData.push({
                betAmount,
                payout,
                gameId,
                clientId,
                timestamp: new Date().toISOString()
            });
        }
        return dummyData;
    }

    /**
     * Simulates fetching a single game round.
     * @returns {object|null} The next game round, or null if no more data.
     */
    fetchNextGameRound() 
    {
        if (this.currentIndex < this.gameData.length) {
            const round = this.gameData[this.currentIndex];
            this.currentIndex++;
            return round;
        }
        return null; // No more data
    }

    /**
     * Resets the data source index.
     */
    reset() 
    {
        this.currentIndex = 0;
    }

    /**
     * Returns the total number of available game rounds.
     * @returns {number}
     */
    getTotalRounds() 
    {
        return this.gameData.length;
    }

 test.describe('RTP Performance and Accuracy Audit', () => {
    const NUM_SPINS_TO_SIMULATE = 5000; // Simulate 5000 game spins
    const SNAPSHOT_INTERVAL = 100; // Take an RTP snapshot every 100 rounds

    let rtpCalculator;
    let rtpStatistics;
    let mockDataSource;

    test.beforeAll(async () => {
        // Initialize RTP components
        rtpCalculator = new RTPCalculator({
            targetRTP: 96.0, // Overall target RTP for the simulation
            tolerance: 0.5,  // Overall acceptable tolerance
            minSampleSize: 100 // Min rounds for a stable RTP calculation
        });
        rtpStatistics = new RTPStatistics(96.0, 0.5); // Use the same target/tolerance

        // Initialize data source (tries to load from file, then generates dummy)
        mockDataSource = new MockGameDataSource();
        // Ensure we simulate at least NUM_SPINS_TO_SIMULATE rounds
        if (mockDataSource.getTotalRounds() < NUM_SPINS_TO_SIMULATE) {
            RTPUtils.log(`Warning: Sample data has ${mockDataSource.getTotalRounds()} rounds. Simulating up to ${NUM_SPINS_TO_SIMULATE} rounds by extending dummy data.`, 'warn');
            // This would trigger _generateDummyData internally if constructor failed to load
        }
    });

    test.beforeEach(() => {
        // Reset statistics and data source for each test run if needed
        rtpStatistics.reset();
        mockDataSource.reset();
    });

    test(`should simulate ${NUM_SPINS_TO_SIMULATE} game spins and audit RTP accuracy`, async ({}) => {
        RTPUtils.log(`Starting RTP accuracy audit for ${NUM_SPINS_TO_SIMULATE} spins...`);
        let processedRounds = 0;

        while (processedRounds < NUM_SPINS_TO_SIMULATE) {
            const gameRound = mockDataSource.fetchNextGameRound();
            if (!gameRound) {
                RTPUtils.log(`No more game data from source after ${processedRounds} rounds.`, 'info');
                break;
            }

            // Simulate API logic and data transfer to RTP component
            // In a real Playwright E2E test, this would be:
            // 1. A Playwright API call (`await request.post(...)`)
            // 2. Extracting betAmount, payout from the response
            // 3. Passing to rtpStatistics.addGameRound({ betAmount, payout, gameId, clientId })

            rtpStatistics.addGameRound(gameRound);
            processedRounds++;

            if (processedRounds % SNAPSHOT_INTERVAL === 0) {
                rtpStatistics.snapshotRTP();
                const currentRTP = rtpStatistics.getCurrentCumulativeRTP();
                RTPUtils.log(`Round ${processedRounds}: Current RTP = ${currentRTP.toFixed(2)}% (Target: ${rtpStatistics.targetRTP.toFixed(2)}%)`);
            }
        }

        // Final RTP calculation and reporting
        const finalReport = rtpStatistics.generateReport();
        RTPUtils.log('\n--- RTP Audit Final Report ---');
        RTPUtils.log(`Total Simulated Rounds: ${finalReport.totalRounds}`);
        RTPUtils.log(`Target RTP: ${finalReport.targetRTP.toFixed(2)}%`);
        RTPUtils.log(`Final Actual RTP: ${finalReport.finalActualRTP.toFixed(2)}%`);
        RTPUtils.log(`Final Deviation: ${finalReport.finalDeviation.toFixed(2)}%`);
        RTPUtils.log(`Is Final RTP within Tolerance (${rtpStatistics.tolerance}%): ${finalReport.isFinalRTPValid ? 'YES' : 'NO'}`);
        RTPUtils.log(`Critical RTP Errors Detected: ${finalReport.criticalErrorCount}`);

        // Assertions for the Playwright test
        expect(finalReport.totalRounds).toBeGreaterThanOrEqual(NUM_SPINS_TO_SIMULATE); // Should run for desired spins
        expect(finalReport.isFinalRTPValid).toBe(true, `Final RTP (${finalReport.finalActualRTP.toFixed(2)}%) outside tolerance (${rtpStatistics.tolerance}%) of target (${finalReport.targetRTP.toFixed(2)}%)`);
        expect(finalReport.criticalErrorCount).toBe(0, `Found ${finalReport.criticalErrorCount} critical RTP deviations. Review criticalErrorsDetails.`);

        // Log detailed critical errors if any for the report
        if (finalReport.criticalErrorCount > 0) {
            RTPUtils.log('\n--- Critical Error Details ---', 'error');
            finalReport.criticalErrorsDetails.forEach((error, index) => {
                RTPUtils.log(`${index + 1}. Round: ${error.roundCount}, RTP: ${error.rtp.toFixed(2)}%, Deviation: ${error.deviation.toFixed(2)}% - ${error.message}`, 'error');
            });
        }
        RTPUtils.log('--- End of Report ---');
    });

    // Example of another performance test, e.g., for different game RTPs
    test(`should audit RTP for specific games (e.g., Slot Game)`, async () => {
        const SLOT_GAME_ID = 'game-slot-01';
        const SLOT_TARGET_RTP = 96.5; // From generate-sample-data config
        const CUSTOM_TOLERANCE = 0.8; // Specific tolerance for this game test

        const rtpCalculatorSlot = new RTPCalculator({ targetRTP: SLOT_TARGET_RTP, tolerance: CUSTOM_TOLERANCE });
        const rtpStatisticsSlot = new RTPStatistics(SLOT_TARGET_RTP, CUSTOM_TOLERANCE);

        mockDataSource.reset(); // Ensure starting from beginning

        let slotRounds = [];
        let processedSlotRounds = 0;
        const targetSlotRounds = Math.min(NUM_SPINS_TO_SIMULATE / mockDataSource.gameIds.length, 2000); // Aim for a portion of total spins

        while (processedSlotRounds < targetSlotRounds) {
            const gameRound = mockDataSource.fetchNextGameRound();
            if (!gameRound) break;

            if (gameRound.gameId === SLOT_GAME_ID) {
                slotRounds.push(gameRound);
                rtpStatisticsSlot.addGameRound(gameRound);
                processedSlotRounds++;
                if (processedSlotRounds % (SNAPSHOT_INTERVAL / 2) === 0) {
                    rtpStatisticsSlot.snapshotRTP();
                }
            }
        }
        
        // Skip test if not enough specific game data was found
        test.skip(processedSlotRounds < 100, 'Not enough data generated for specific slot game to run detailed audit.');

        const slotReport = rtpStatisticsSlot.generateReport();
        RTPUtils.log(`\n--- RTP Audit for ${SLOT_GAME_ID} ---`);
        RTPUtils.log(`Total Simulated Rounds for ${SLOT_GAME_ID}: ${slotReport.totalRounds}`);
        RTPUtils.log(`Target RTP for ${SLOT_GAME_ID}: ${slotReport.targetRTP.toFixed(2)}%`);
        RTPUtils.log(`Final Actual RTP for ${SLOT_GAME_ID}: ${slotReport.finalActualRTP.toFixed(2)}%`);
        RTPUtils.log(`Final Deviation for ${SLOT_GAME_ID}: ${slotReport.finalDeviation.toFixed(2)}%`);
        RTPUtils.log(`Is Final RTP within Tolerance (${rtpStatisticsSlot.tolerance}%): ${slotReport.isFinalRTPValid ? 'YES' : 'NO'}`);
        RTPUtils.log(`Critical RTP Errors for ${SLOT_GAME_ID}: ${slotReport.criticalErrorCount}`);

        expect(slotReport.totalRounds).toBeGreaterThanOrEqual(100); // Ensure meaningful sample size
        expect(slotReport.isFinalRTPValid).toBe(true, `RTP for ${SLOT_GAME_ID} (${slotReport.finalActualRTP.toFixed(2)}%) outside its tolerance (${rtpStatisticsSlot.tolerance}%) of target (${slotReport.targetRTP.toFixed(2)}%)`);
        expect(slotReport.criticalErrorCount).toBe(0, `Found ${slotReport.criticalErrorCount} critical RTP deviations for ${SLOT_GAME_ID}.`);
    });
});