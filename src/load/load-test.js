// api/src/load/load-test.js

const ApiClient = require('../clients/api-client');
const { API_BASE_URL } = process.env;
const { log } = require('../utils'); // Assuming utils is accessible

/**
 * LoadTestManager: Orchestrates multiple API client simulations for load testing.
 * Renamed from LoadTestManager to match 'load-test.js'
 */
class LoadTest { // Renamed class to LoadTest
    constructor(config = {}) {
        this.numClients = config.numClients || 10;
        this.gameId = config.gameId || 'default-load-game';
        this.betAmount = config.betAmount || 10;
        this.durationSeconds = config.durationSeconds || 60; // Duration for each client simulation
        this.clients = [];
        this.clientErrors = {}; // Track errors per client
        this.totalRequests = 0;
        this.successfulRequests = 0;
        this.failedRequests = 0;
        this.latencies = [];
    }


    /**
     * Runs RTP simulation load test
     * @param {number} spinCount - Number of spins per simulation
     * @param {number} batchSize - Number of concurrent simulations
     */
    async runRtpSimulationTest(spinCount, batchSize) {
        log(`Starting RTP simulation load test: ${batchSize} concurrent simulations of ${spinCount} spins`, 'info');
        const startTime = Date.now();
        
        // Create simulation batches
        const batches = [];
        for (let i = 0; i < batchSize; i++) {
            batches.push(this.runSingleSimulation(spinCount, i));
        }
        
        // Run all batches concurrently
        await Promise.all(batches);
        
        const duration = (Date.now() - startTime) / 1000;
        log(`RTP simulation load test completed in ${duration} seconds`, 'success');
    }

    /**
     * Runs a single simulation
     * @param {number} spinCount - Number of spins
     * @param {number} batchId - Batch identifier
     */
    async runSingleSimulation(spinCount, batchId) {
        const client = this.clients[batchId % this.clients.length];
        try {
            const startTime = Date.now();
            const sessionId = await client.runSpinSimulation(this.gameId, spinCount);
            const results = await client.getSimulationResults(sessionId);
            
            // Calculate and validate RTP
            const totalBet = results.reduce((sum, r) => sum + r.betAmount, 0);
            const totalPayout = results.reduce((sum, r) => sum + r.payout, 0);
            const rtp = (totalPayout / totalBet) * 100;
            
            this.latencies.push(Date.now() - startTime);
            this.simulationResults.push({ batchId, rtp, spinCount, duration: Date.now() - startTime });
            
            log(`Batch ${batchId}: RTP ${rtp.toFixed(2)}% from ${spinCount} spins`, 'info');
        } catch (error) {
            log(`Batch ${batchId} failed: ${error.message}`, 'error');
            this.failedRequests++;
        }
    }

    /**
     * Initializes the specified number of API clients.
     */
    async initializeClients() {
        log(`Initializing ${this.numClients} API clients...`, 'info');
        for (let i = 0; i < this.numClients; i++) {
            const clientId = `load-client-${i + 1}`;
            const client = new ApiClient({
                baseURL: API_BASE_URL,
                clientId: clientId,
                // Add username/password if needed for each client from .env or config
                username: process.env.API_USERNAME,
                password: process.env.API_PASSWORD
            });
            this.clients.push(client);
            this.clientErrors[clientId] = 0;
        }
    }

    /**
     * Logs in all clients and starts their game sessions.
     */
    async setupClientSessions() {
        const setupPromises = this.clients.map(async (client) => {
            try {
                await client.login();
                await client.startGameSession(this.gameId);
                log(`Client ${client.clientId} logged in and session started.`, 'success');
            } catch (error) {
                log(`Failed to set up client ${client.clientId}: ${error.message}`, 'error');
                this.clientErrors[client.clientId]++;
            }
        });
        await Promise.all(setupPromises);
    }

    /**
     * Runs the load test for the specified duration.
     */
    async runTest() {
        log(`Starting load test for ${this.durationSeconds} seconds with ${this.numClients} clients...`, 'info');
        const startTime = Date.now();
        const endTime = startTime + (this.durationSeconds * 1000);

        const clientActivityPromises = this.clients.map(async (client) => {
            while (Date.now() < endTime) {
                const requestStartTime = Date.now();
                this.totalRequests++;
                try {
                    await client.placeBet(this.gameId, this.betAmount);
                    this.successfulRequests++;
                    this.latencies.push(Date.now() - requestStartTime);
                } catch (error) {
                    log(`Client ${client.clientId} error during bet placement: ${error.message}`, 'error');
                    this.failedRequests++;
                    this.clientErrors[client.clientId]++;
                }
                await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100)); // Simulate think time
            }
            try {
                await client.endGameSession();
            } catch (error) {
                log(`Client ${client.clientId} error ending session: ${error.message}`, 'error');
            }
        });

        await Promise.all(clientActivityPromises);
        log('Load test completed.', 'info');
    }

    /**
     * Generates a summary report of the load test.
     * @returns {object} - Load test metrics.
     */
    generateReport() {
        const avgLatency = this.latencies.length > 0
            ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
            : 0;
        const throughput = this.successfulRequests / this.durationSeconds;

        return {
            numClients: this.numClients,
            durationSeconds: this.durationSeconds,
            totalRequests: this.totalRequests,
            successfulRequests: this.successfulRequests,
            failedRequests: this.failedRequests,
            errorRate: (this.failedRequests / this.totalRequests * 100).toFixed(2) + '%',
            avgLatencyMs: avgLatency.toFixed(2),
            throughputReqPerSec: throughput.toFixed(2),
            clientErrorDetails: this.clientErrors,
        };
    }

    /**
     * Runs the full load testing sequence.
     */
    async runFullTest() {
        await this.initializeClients();
        await this.setupClientSessions();
        await this.runTest();
        const report = this.generateReport();
        log('\n--- Load Test Report ---');
        log(report);
        return report;
    }
}

module.exports = LoadTest; // Export the renamed class