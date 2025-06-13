// rtp/tests/rtp-performance.spec.js (Updated for Real API Integration)

const { test, expect } = require('@playwright/test');
const RTPCalculator = require('../src/core/rtp-calculator');
const RTPStatistics = require('../src/core/rtp-statistics');
const RTPUtils = require('../src/utils');

// Import the API Client from your colleague's API component
// Adjust this path if the API component structure changes
const ApiClient = require('../api/src/clients/api-client');

// Load environment variables (ensure you have a .env file in rtp/ with API_BASE_URL, etc.)
require('dotenv').config({ path: 'rtp/.env' });

test.describe('RTP Performance and Accuracy Audit (Real API Integration)', () => {
    // Define the number of game rounds to simulate against the live API
    const NUM_SPINS_TO_SIMULATE = process.env.NUM_SPINS_TO_SIMULATE ? parseInt(process.env.NUM_SPINS_TO_SIMULATE, 10) : 1000;
    const SNAPSHOT_INTERVAL = 100; // How often to log current RTP and take a snapshot

    let rtpStatistics;
    let apiClient; // Declare apiClient instance

    // Test specific client and game IDs
    const TEST_CLIENT_ID = process.env.TEST_CLIENT_ID || 'test-client-rtp-001';
    const TEST_GAME_ID = process.env.TEST_GAME_ID || 'test-game-slot-01'; // Default game ID to use

    // Set up before all tests in this describe block
    test.beforeAll(async ({ request }) => {
        // Initialize RTPStatistics with game-specific targets and anomaly thresholds
        rtpStatistics = new RTPStatistics({
            overallTargetRTP: 96.0,
            overallTolerance: 0.5,
            criticalToleranceFactor: 2, // 2x tolerance deviation is critical
            minRoundsForRTPValidation: 100,
            maxLosingStreak: 50, // Flag a losing streak over 50
            gameSpecificRTPs: {
                // Example: Define expected RTP for specific games
                'test-game-slot-01': 96.5,
                'test-game-roulette-02': 97.3,
            }
        });

        // Initialize the API Client
        apiClient = new ApiClient({
            baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api', // Fallback URL if .env not set
            clientId: TEST_CLIENT_ID, // Use a dedicated client ID for testing
            username: process.env.API_USERNAME, // Example: for authentication
            password: process.env.API_PASSWORD // Example: for authentication
        });

        RTPUtils.log(`Attempting to connect to API at: ${apiClient.baseURL}`, 'info');

        try {
            // Perform login and start a game session once for all tests
            await apiClient.login();
            RTPUtils.log('API Client logged in successfully.', 'success');

            await apiClient.startGameSession(TEST_GAME_ID);
            RTPUtils.log(`Game session started for client '${TEST_CLIENT_ID}' and game '${TEST_GAME_ID}'.`, 'success');

        } catch (error) {
            RTPUtils.log(`Failed to initialize API client or start session: ${error.message}`, 'error');
            // If setup fails, all tests will likely fail, so we'll let it throw
            throw new Error(`API client setup failed: ${error.message}`);
        }
    });

    // Reset RTP statistics before each test run
    test.beforeEach(() => {
        rtpStatistics.reset();
        // Note: For real API tests, you might not "reset" the API client state
        // per test, unless you're starting a fresh session for each test.
        // For high-volume, it's usually one session per test file or `beforeAll`.
    });

    test(`should simulate ${NUM_SPINS_TO_SIMULATE} game spins against real API and audit RTP`, async () => {
        RTPUtils.log(`Starting real API RTP audit for ${NUM_SPINS_TO_SIMULATE} spins...`);
        let processedRounds = 0;
        const BET_AMOUNT_PER_ROUND = 10; // Example fixed bet amount

        // Loop to simulate game rounds by interacting with the real API
        while (processedRounds < NUM_SPINS_TO_SIMULATE) {
            try {
                // 1. Place a bet via the API
                const betResult = await apiClient.placeBet(TEST_GAME_ID, BET_AMOUNT_PER_ROUND);

                // Assuming placeBet returns enough info to determine if a payout call is needed or if payout is in betResult
                let payout = betResult.payout || 0; // Default to 0 if no immediate payout in bet result

                // 2. If the API requires a separate call to get the payout (e.g., process payout)
                // This part is highly dependent on your API's actual workflow
                if (betResult.requiresPayoutProcessing && betResult.transactionId) {
                    const payoutResult = await apiClient.processPayout(betResult.transactionId);
                    payout = payoutResult.payout;
                }

                // Construct the game round object from the real API response
                const gameRoundFromAPI = {
                    betAmount: BET_AMOUNT_PER_ROUND, // Or betResult.betAmount if API returns it
                    payout: payout,
                    gameId: TEST_GAME_ID, // Use the game ID used for the session
                    clientId: TEST_CLIENT_ID, // Use the client ID used for the session
                    timestamp: new Date().toISOString()
                };

                // Add the real game round data to your RTP statistics
                rtpStatistics.addGameRound(gameRoundFromAPI);
                processedRounds++;

                if (processedRounds % SNAPSHOT_INTERVAL === 0) {
                    rtpStatistics.snapshotRTP(); // This will now snapshot overall, per-game, per-client RTPs
                    RTPUtils.log(`Round ${processedRounds}: Overall RTP = ${rtpStatistics.getCurrentCumulativeRTP().toFixed(2)}%`);
                }

            } catch (error) {
                RTPUtils.log(`API Interaction Error for round ${processedRounds + 1}: ${error.message}`, 'error');
                // Decide how to handle API errors:
                // - continue: if you want to see how RTP is affected by some failed rounds
                // - break: if an API error means the test cannot proceed meaningfully
                // For a robust RTP test, you might want to log the error and continue if it's not critical.
                // If it's a critical error (e.g., authentication lost), you might want to break.
                // For this example, we'll log and continue to process as many rounds as possible.
                // You might also want to decrement `processedRounds` if the round was truly invalid.
                continue; // Skip to the next iteration
            }
        }

        const finalReport = rtpStatistics.generateReport();
        RTPUtils.log('\n--- RTP Audit Final Report (Real API) ---');
        RTPUtils.log(`Total Simulated Rounds: ${finalReport.totalRoundsSimulated}`);
        RTPUtils.log(`Overall Target RTP: ${finalReport.overallTargetRTP.toFixed(2)}%`);
        RTPUtils.log(`Final Overall Actual RTP: ${finalReport.finalOverallActualRTP.toFixed(2)}%`);
        RTPUtils.log(`Final Overall Deviation: ${finalReport.finalOverallDeviation.toFixed(2)}%`);
        RTPUtils.log(`Is Final Overall RTP within Tolerance (${finalReport.overallTolerance}%): ${finalReport.isFinalOverallRTPValid ? 'YES' : 'NO'}`);
        RTPUtils.log(`Critical Anomalies Detected: ${finalReport.criticalErrorCount}`);

        if (finalReport.criticalErrorCount > 0) {
            RTPUtils.log('\n--- Critical Anomaly Details ---', 'error');
            finalReport.criticalErrorsDetails.forEach((error, index) => {
                RTPUtils.log(`${index + 1}. [${error.type}] Round: ${error.roundCount}, Message: ${error.message}`, 'error');
            });
        }

        RTPUtils.log('\n--- Per-Game Summary ---');
        for (const gameId in finalReport.perGameSummary) {
            const summary = finalReport.perGameSummary[gameId];
            RTPUtils.log(`  Game: ${gameId}, Rounds: ${summary.rounds}, Actual RTP: ${summary.actualRTP}, Target RTP: ${summary.targetRTP}, Current Losing Streak: ${summary.losingStreak}`);
        }

        RTPUtils.log('\n--- Per-Client Summary ---');
        for (const clientId in finalReport.perClientSummary) {
            const summary = finalReport.perClientSummary[clientId];
            RTPUtils.log(`  Client: ${clientId}, Rounds: ${summary.rounds}, Actual RTP: ${summary.actualRTP}, Current Losing Streak: ${summary.losingStreak}`);
        }
        RTPUtils.log('--- End of Report ---');

        // Assertions for the Playwright test
        expect(finalReport.totalRoundsSimulated).toBeGreaterThanOrEqual(NUM_SPINS_TO_SIMULATE);
        expect(finalReport.isFinalOverallRTPValid).toBe(true, `Overall RTP (${finalReport.finalOverallActualRTP.toFixed(2)}%) outside tolerance.`);
        expect(finalReport.criticalErrorCount).toBe(0, `Found ${finalReport.criticalErrorCount} critical anomalies. Review details.`);

        // Add more specific assertions if needed, e.g., to check specific game or client RTPs
        // expect(finalReport.perGameSummary[TEST_GAME_ID].actualRTP).toBeCloseTo(finalReport.perGameSummary[TEST_GAME_ID].targetRTP.replace('%', ''), 1);
    });
});