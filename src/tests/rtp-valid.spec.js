// tests/rtp-validation.spec.js
const { test, expect } = require('@playwright/test');
const RTPCalculator = require('../src/core/rtp-calc');
const RTPStatistics = require('../src/core/rtp-stats');
const RTPUtils = require('../tests/utils');

test.describe('RTPCalculator Validation', () => {
    let rtpCalculator;

    test.beforeEach(() => {
        // Initialize RTPCalculator with a typical configuration
        rtpCalculator = new RTPCalculator({
            targetRTP: 96.0,
            tolerance: 0.5,
            minSampleSize: 10
        });
    });

    test('should correctly calculate RTP for basic scenario', () => {
        const gameData = [
            { betAmount: 100, payout: 96 },
            { betAmount: 50, payout: 48 },
            { betAmount: 200, payout: 192 }
        ];
        const actualRTP = rtpCalculator.calculateActualRTP(gameData);
        expect(actualRTP).toBeCloseTo(96.0);
    });

    test('should return 0 RTP for no game data', () => {
        const gameData = [];
        const actualRTP = rtpCalculator.calculateActualRTP(gameData);
        expect(actualRTP).toBe(0);
    });

    test('should return 0 RTP if total bets are zero', () => {
        const gameData = [{ betAmount: 0, payout: 10 }]; // This scenario implies an error or edge case
        const actualRTP = rtpCalculator.calculateActualRTP(gameData);
        expect(actualRTP).toBe(0);
    });

    test('should correctly validate RTP within tolerance', () => {
        const actualRTP = 96.3; // Within 0.5 tolerance of 96.0
        const validation = rtpCalculator.validateRTP(actualRTP, rtpCalculator.targetRTP);
        expect(validation.isValid).toBe(true);
        expect(validation.deviation).toBeCloseTo(0.3);
        expect(validation.confidence).toBe('Moderate Confidence (within acceptable range)');
    });

    test('should correctly invalidate RTP outside tolerance', () => {
        const actualRTP = 97.0; // Outside 0.5 tolerance of 96.0
        const validation = rtpCalculator.validateRTP(actualRTP, rtpCalculator.targetRTP);
        expect(validation.isValid).toBe(false);
        expect(validation.deviation).toBeCloseTo(1.0);
        expect(validation.confidence).toBe('Low Confidence (outside acceptable range)');
    });

    test('should handle edge case with 100% RTP (all payout)', () => {
        const gameData = [{ betAmount: 100, payout: 100 }];
        const actualRTP = rtpCalculator.calculateActualRTP(gameData);
        expect(actualRTP).toBeCloseTo(100);
        const validation = rtpCalculator.validateRTP(actualRTP, rtpCalculator.targetRTP);
        // This might be valid or invalid depending on targetRTP and tolerance
        expect(validation.isValid).toBe(Math.abs(100 - rtpCalculator.targetRTP) <= rtpCalculator.tolerance);
    });

    test('should handle edge case with 0% RTP (no payout)', () => {
        const gameData = [{ betAmount: 100, payout: 0 }];
        const actualRTP = rtpCalculator.calculateActualRTP(gameData);
        expect(actualRTP).toBeCloseTo(0);
        const validation = rtpCalculator.validateRTP(actualRTP, rtpCalculator.targetRTP);
        expect(validation.isValid).toBe(Math.abs(0 - rtpCalculator.targetRTP) <= rtpCalculator.tolerance);
    });
});

test.describe('RTPStatistics Validation', () => {
    let rtpStatistics;

    test.beforeEach(() => {
        rtpStatistics = new RTPStatistics(96.0, 0.5); // Target RTP 96%, tolerance 0.5%
    });

    test('should correctly add game rounds and calculate cumulative RTP', () => {
        rtpStatistics.addGameRound({ betAmount: 100, payout: 95, gameId: 'g1', clientId: 'c1' });
        rtpStatistics.addGameRound({ betAmount: 100, payout: 97, gameId: 'g1', clientId: 'c1' });
        
        expect(rtpStatistics.gameRounds.length).toBe(2);
        expect(rtpStatistics.totalBets).toBe(200);
        expect(rtpStatistics.totalPayouts).toBe(192);
        expect(rtpStatistics.getCurrentCumulativeRTP()).toBeCloseTo(96.0);
    });

    test('should snapshot RTP and record deviations', () => {
        rtpStatistics.addGameRound({ betAmount: 100, payout: 96, gameId: 'g1', clientId: 'c1' }); // RTP 96%
        rtpStatistics.snapshotRTP();
        expect(rtpStatistics.rtpHistory.length).toBe(1);
        expect(rtpStatistics.rtpHistory[0].rtp).toBeCloseTo(96.0);
        expect(rtpStatistics.deviations[0].isWithinTolerance).toBe(true);

        rtpStatistics.addGameRound({ betAmount: 100, payout: 98, gameId: 'g1', clientId: 'c1' }); // Cumulative RTP (96+98)/200 = 97%
        rtpStatistics.snapshotRTP();
        expect(rtpStatistics.rtpHistory.length).toBe(2);
        expect(rtpStatistics.rtpHistory[1].rtp).toBeCloseTo(97.0);
        // Deviation from 96% target: |97 - 96| = 1.0, which is > tolerance 0.5
        expect(rtpStatistics.deviations[1].isWithinTolerance).toBe(false);
    });

    test('should detect and record critical errors', () => {
        // High RTP deviation
        rtpStatistics.addGameRound({ betAmount: 100, payout: 120, gameId: 'g1', clientId: 'c1' }); // RTP 120%
        rtpStatistics.snapshotRTP();
        expect(rtpStatistics.criticalErrors.length).toBe(1);
        expect(rtpStatistics.criticalErrors[0].message).toContain('CRITICAL RTP DEVIATION');
        expect(rtpStatistics.criticalErrors[0].rtp).toBeCloseTo(120);

        // Low RTP deviation
        rtpStatistics.reset();
        rtpStatistics.addGameRound({ betAmount: 100, payout: 50, gameId: 'g1', clientId: 'c1' }); // RTP 50%
        rtpStatistics.snapshotRTP();
        expect(rtpStatistics.criticalErrors.length).toBe(1);
        expect(rtpStatistics.criticalErrors[0].message).toContain('CRITICAL RTP DEVIATION');
        expect(rtpStatistics.criticalErrors[0].rtp).toBeCloseTo(50);
    });

    test('should generate a comprehensive report', () => {
        rtpStatistics.addGameRound({ betAmount: 10, payout: 9.6, gameId: 'g1', clientId: 'c1' });
        rtpStatistics.addGameRound({ betAmount: 10, payout: 9.5, gameId: 'g1', clientId: 'c1' });
        rtpStatistics.snapshotRTP(); // Snapshot at round 2

        const report = rtpStatistics.generateReport();
        expect(report.totalRounds).toBe(2);
        expect(report.targetRTP).toBe(96.0);
        expect(report.finalActualRTP).toBeCloseTo(95.5); // (9.6 + 9.5) / 20 * 100
        expect(report.isFinalRTPValid).toBe(true); // Deviation |95.5 - 96.0| = 0.5, which is <= tolerance
        expect(report.rtpHistorySnapshots.length).toBeGreaterThanOrEqual(1);
        expect(report.criticalErrorCount).toBe(0);
        expect(report.payoutStandardDeviation).toBeDefined();
    });

    test('should reset statistics', () => {
        rtpStatistics.addGameRound({ betAmount: 10, payout: 9.6, gameId: 'g1', clientId: 'c1' });
        rtpStatistics.snapshotRTP();
        rtpStatistics.reset();
        expect(rtpStatistics.gameRounds.length).toBe(0);
        expect(rtpStatistics.rtpHistory.length).toBe(0);
        expect(rtpStatistics.criticalErrors.length).toBe(0);
        expect(rtpStatistics.totalBets).toBe(0);
        expect(rtpStatistics.totalPayouts).toBe(0);
    });
});