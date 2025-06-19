// src/services/rtp-orchestrator.js
const ApiClient = require('../clients/api-client');
const ResultsAnalyzer = require('./results-analyzer');
const { log, logError } = require('../utils');
const { SIMULATION_DEFAULTS, VALIDATION_THRESHOLDS } = require('../config/api-config');

class RTPOrchestrator {
    constructor() {
        this.apiClient = new ApiClient();
        this.analyzer = new ResultsAnalyzer();
    }

    async init() {
        await this.apiClient.initSwaggerClient();
        await this.apiClient.login();
    }

    async runFullTest(gameId) {
        try {
            await this.init();
            
            // Step 1: Update RTP
            const newRTP = 96; // Example value
            log(`Updating RTP to ${newRTP}% for game ${gameId}`);
            await this.apiClient.updateGameRTP(gameId, newRTP);
            
            // Step 2: Run simulation
            log(`Starting 5000-spin simulation for game ${gameId}`);
            const sessionId = await this.apiClient.runSpinSimulation(gameId, 5000);
            
            // Step 3: Get results
            log(`Retrieving results for session ${sessionId}`);
            const results = await this.apiClient.getSimulationResults(sessionId);
            
            // Step 4: Validate RTP
            log('Validating RTP results');
            const report = this.analyzer.analyze(results);
            
            // Step 5: Verify compliance
            if (Math.abs(report.calculatedRTP - newRTP) > VALIDATION_THRESHOLDS.ACCEPTABLE_VARIANCE) {
                throw new Error(`RTP variance too high! Expected: ${newRTP}%, Actual: ${report.calculatedRTP}%`);
            }
            
            log(`RTP validation successful. Actual RTP: ${report.calculatedRTP}%`);
            return report;
        } catch (error) {
            logError(error, 'RTPOrchestrator.runFullTest');
            throw error;
        }
    }

    async runSimulation(gameId, spinCount = 5000) {
        try {
            await this.init();
            return await this.apiClient.runSpinSimulation(gameId, spinCount);
        } catch (error) {
            logError(error, 'RTPOrchestrator.runSimulation');
            throw error;
        }
    }
}

module.exports = RTPOrchestrator;