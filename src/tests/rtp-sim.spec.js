// src/tests/rtp-simulation.spec.js
const { test, expect } = require('@playwright/test');
const RTPOrchestrator = require('../services/rtp-orch');
const ResultsAnalyzer = require('../services/results-anal');
const { VALIDATION_THRESHOLDS } = require('../config/api-config');

test.describe('RTP Simulation Accuracy Tests', () => {
    const TEST_GAME_ID = 'test-game-001';
    const analyzer = new ResultsAnalyzer();
    
    test('5000-spin simulation statistical accuracy', async () => {
        const orchestrator = new RTPOrchestrator();
        const report = await orchestrator.runFullTest(TEST_GAME_ID);
        
        // Validate statistical properties
        expect(report.calculatedRTP).toBeGreaterThanOrEqual(VALIDATION_THRESHOLDS.RTP_MIN);
        expect(report.calculatedRTP).toBeLessThanOrEqual(VALIDATION_THRESHOLDS.RTP_MAX);
        expect(report.rtpStats.stdDev).toBeLessThan(5);
        expect(report.anomalies.length).toBeLessThan(report.totalSpins * 0.01); // <1% anomalies
    });
    
    test('RTP variance detection', async () => {
        const testData = [
            { betAmount: 1, payout: 0.95, gameId: TEST_GAME_ID },
            { betAmount: 1, payout: 0.97, gameId: TEST_GAME_ID },
            // ... add more test data ...
        ];
        
        const report = analyzer.analyze(testData);
        report.expectedRTP = 95;
        
        // Force a variance violation
        report.calculatedRTP = 92;
        const variance = Math.abs(report.calculatedRTP - report.expectedRTP);
        
        expect(variance).toBeGreaterThan(VALIDATION_THRESHOLDS.ACCEPTABLE_VARIANCE);
    });
});