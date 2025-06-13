// src/core/rtp-stats.js (Enhanced)
const RTPUtils = require('../tests/utils');
const RTPCalculator = require('./rtp-calc'); // Assuming RTPCalculator is in the same core folder

class RTPStatistics {
    constructor(config = {}) {
        this.config = {
            overallTargetRTP: config.overallTargetRTP || 96.0,
            overallTolerance: config.overallTolerance || 0.5,
            criticalToleranceFactor: config.criticalToleranceFactor || 2, // e.g., if deviation is double the tolerance
            minRoundsForRTPValidation: config.minRoundsForRTPValidation || 100, // Minimum rounds before validating RTP
            maxLosingStreak: config.maxLosingStreak || 50, // Max consecutive losses to flag
            gameSpecificRTPs: config.gameSpecificRTPs || {}, // e.g., { 'game-slot-01': 96.5, 'game-roulette-02': 97.3 }
            ...config // Allow overriding any default config
        };

        this.rtpCalculator = new RTPCalculator({ // Use RTPCalculator for actual RTP calculations
            targetRTP: this.config.overallTargetRTP,
            tolerance: this.config.overallTolerance,
            minSampleSize: this.config.minRoundsForRTPValidation
        });

        this.gameRounds = []; // Stores all processed game round data
        this.rtpHistory = []; // Stores calculated RTP at various intervals

        this.criticalErrors = []; // Stores specific critical RTP deviations or behavioral anomalies

        this.totalBets = 0;
        this.totalPayouts = 0;

        // Granular tracking
        this.perGameStats = {}; // { 'gameId': { totalBets, totalPayouts, rounds, currentLosingStreak } }
        this.perClientStats = {}; // { 'clientId': { totalBets, totalPayouts, rounds, currentLosingStreak } }
    }

    /**
     * Adds a single game round to the statistics and updates granular stats.
     * @param {object} gameRound - A game round object with betAmount, payout, gameId, clientId.
     */
    addGameRound(gameRound) {
        if (!gameRound || typeof gameRound.betAmount !== 'number' || typeof gameRound.payout !== 'number' || !gameRound.gameId || !gameRound.clientId) {
            RTPUtils.log('Invalid or incomplete game round data provided to RTPStatistics.', 'warn');
            return;
        }

        this.gameRounds.push(gameRound);
        this.totalBets += gameRound.betAmount;
        this.totalPayouts += gameRound.payout;

        // Update per-game stats
        if (!this.perGameStats[gameRound.gameId]) {
            this.perGameStats[gameRound.gameId] = { totalBets: 0, totalPayouts: 0, rounds: 0, currentLosingStreak: 0 };
        }
        this.perGameStats[gameRound.gameId].totalBets += gameRound.betAmount;
        this.perGameStats[gameRound.gameId].totalPayouts += gameRound.payout;
        this.perGameStats[gameRound.gameId].rounds++;

        // Update per-client stats
        if (!this.perClientStats[gameRound.clientId]) {
            this.perClientStats[gameRound.clientId] = { totalBets: 0, totalPayouts: 0, rounds: 0, currentLosingStreak: 0 };
        }
        this.perClientStats[gameRound.clientId].totalBets += gameRound.betAmount;
        this.perClientStats[gameRound.clientId].totalPayouts += gameRound.payout;
        this.perClientStats[gameRound.clientId].rounds++;

        // Track losing streaks for the current round
        this._trackLosingStreaks(gameRound);
    }

    /**
     * Tracks losing streaks for clients and games.
     * @param {object} gameRound
     * @private
     */
    _trackLosingStreaks(gameRound) {
        const isLoss = gameRound.payout < gameRound.betAmount;

        // Update client losing streak
        if (isLoss) {
            this.perClientStats[gameRound.clientId].currentLosingStreak++;
        } else {
            // If the client won, reset streak and check if previous streak was critical
            if (this.perClientStats[gameRound.clientId].currentLosingStreak >= this.config.maxLosingStreak) {
                 this._flagCriticalError(
                    `Losing Streak Anomaly for Client '${gameRound.clientId}'`,
                    `Client experienced ${this.perClientStats[gameRound.clientId].currentLosingStreak} consecutive losses, exceeding max allowed (${this.config.maxLosingStreak}).`
                );
            }
            this.perClientStats[gameRound.clientId].currentLosingStreak = 0;
        }

        // Update game losing streak (optional, if you want to track game-wide cold streaks)
        if (isLoss) {
            this.perGameStats[gameRound.gameId].currentLosingStreak++;
        } else {
            this.perGameStats[gameRound.gameId].currentLosingStreak = 0;
        }
    }


    /**
     * Records the current RTP and checks for deviations for overall, per-game, and per-client.
     * Should be called periodically (e.g., after every X rounds).
     */
    snapshotRTP() {
        if (this.gameRounds.length < this.config.minRoundsForRTPValidation) return;

        // Overall RTP
        const overallRTP = this.rtpCalculator.calculateActualRTP(this.gameRounds);
        const overallValidation = this.rtpCalculator.validateRTP(overallRTP, this.config.overallTargetRTP);
        this.rtpHistory.push({
            roundCount: this.gameRounds.length,
            rtp: overallRTP,
            deviation: overallValidation.deviation,
            isWithinTolerance: overallValidation.isValid,
            timestamp: new Date().toISOString()
        });
        if (!overallValidation.isValid && overallValidation.deviation > this.config.overallTolerance * this.config.criticalToleranceFactor) {
            this._flagCriticalError(
                'Overall RTP Deviation',
                `Overall RTP ${overallRTP.toFixed(2)}% vs Target ${this.config.overallTargetRTP.toFixed(2)}% (Deviation: ${overallValidation.deviation.toFixed(2)}%)`
            );
        }

        // Per-Game RTP
        for (const gameId in this.perGameStats) {
            const gameStats = this.perGameStats[gameId];
            if (gameStats.rounds >= this.config.minRoundsForRTPValidation) {
                const gameSpecificTargetRTP = this.config.gameSpecificRTPs[gameId] || this.config.overallTargetRTP;
                const gameDataForRTP = [{ betAmount: gameStats.totalBets, payout: gameStats.totalPayouts }]; // Simulate a single aggregated round
                const gameRTP = this.rtpCalculator.calculateActualRTP(gameDataForRTP);
                const gameValidation = this.rtpCalculator.validateRTP(gameRTP, gameSpecificTargetRTP);

                if (!gameValidation.isValid && gameValidation.deviation > this.config.overallTolerance * this.config.criticalToleranceFactor) {
                    this._flagCriticalError(
                        `Game RTP Deviation for '${gameId}'`,
                        `Actual RTP ${gameRTP.toFixed(2)}% vs Target ${gameSpecificTargetRTP.toFixed(2)}% (Deviation: ${gameValidation.deviation.toFixed(2)}%) after ${gameStats.rounds} rounds.`
                    );
                }
            }
        }

        // Per-Client RTP
        for (const clientId in this.perClientStats) {
            const clientStats = this.perClientStats[clientId];
            if (clientStats.rounds >= this.config.minRoundsForRTPValidation) {
                // For client RTP, we don't necessarily have a "target" per client, but we can check for extreme deviation from overall target
                const clientDataForRTP = [{ betAmount: clientStats.totalBets, payout: clientStats.totalPayouts }];
                const clientRTP = this.rtpCalculator.calculateActualRTP(clientDataForRTP);
                const clientDeviation = Math.abs(clientRTP - this.config.overallTargetRTP);

                // Flag if client RTP is excessively far from the overall target (e.g., 3x tolerance)
                if (clientDeviation > this.config.overallTolerance * 3) { // A stricter threshold for client-specific extreme RTP
                    this._flagCriticalError(
                        `Client RTP Anomaly for '${clientId}'`,
                        `Actual RTP ${clientRTP.toFixed(2)}% vs Overall Target ${this.config.overallTargetRTP.toFixed(2)}% (Deviation: ${clientDeviation.toFixed(2)}%) after ${clientStats.rounds} rounds.`
                    );
                }
            }
        }
    }

    /**
     * Helper to add a critical error.
     * @param {string} type - Type of error (e.g., 'RTP Deviation', 'Losing Streak').
     * @param {string} message - Detailed error message.
     * @private
     */
    _flagCriticalError(type, message) {
        this.criticalErrors.push({
            type: type,
            roundCount: this.gameRounds.length,
            message: message,
            timestamp: new Date().toISOString()
        });
        RTPUtils.log(`${type}: ${message}`, 'error');
    }

    /**
     * Generates a summary report of the RTP statistics.
     * @returns {object} A summary object.
     */
    generateReport() {
        const finalOverallRTP = this.getCurrentCumulativeRTP();
        const finalOverallDeviation = Math.abs(finalOverallRTP - this.config.overallTargetRTP);
        const isFinalOverallRTPValid = finalOverallDeviation <= this.config.overallTolerance;

        // Summarize granular stats
        const perGameSummary = {};
        for (const gameId in this.perGameStats) {
            const stats = this.perGameStats[gameId];
            const gameRTP = (stats.totalBets > 0) ? (stats.totalPayouts / stats.totalBets) * 100 : 0;
            perGameSummary[gameId] = {
                rounds: stats.rounds,
                actualRTP: gameRTP.toFixed(2) + '%',
                targetRTP: (this.config.gameSpecificRTPs[gameId] || this.config.overallTargetRTP).toFixed(2) + '%',
                losingStreak: stats.currentLosingStreak // Current streak when report generated
            };
        }

        const perClientSummary = {};
        for (const clientId in this.perClientStats) {
            const stats = this.perClientStats[clientId];
            const clientRTP = (stats.totalBets > 0) ? (stats.totalPayouts / stats.totalBets) * 100 : 0;
            perClientSummary[clientId] = {
                rounds: stats.rounds,
                actualRTP: clientRTP.toFixed(2) + '%',
                losingStreak: stats.currentLosingStreak // Current streak when report generated
            };
        }

        return {
            totalRoundsSimulated: this.gameRounds.length,
            overallTargetRTP: this.config.overallTargetRTP,
            overallTolerance: this.config.overallTolerance,
            finalOverallActualRTP: finalOverallRTP,
            finalOverallDeviation: finalOverallDeviation,
            isFinalOverallRTPValid: isFinalOverallRTPValid,
            criticalErrorCount: this.criticalErrors.length,
            criticalErrorsDetails: this.criticalErrors,
            rtpHistorySnapshots: this.rtpHistory, // Provides historical RTP trends
            perGameSummary: perGameSummary,
            perClientSummary: perClientSummary,
            // Add other relevant metrics like standard deviation of payouts if desired
        };
    }

    // Existing methods: getCurrentCumulativeRTP, reset (as before)
    getCurrentCumulativeRTP() {
        if (this.totalBets === 0) {
            return 0;
        }
        return (this.totalPayouts / this.totalBets) * 100;
    }

    reset() {
        this.gameRounds = [];
        this.rtpHistory = [];
        this.criticalErrors = [];
        this.totalBets = 0;
        this.totalPayouts = 0;
        this.perGameStats = {};
        this.perClientStats = {};
    }
}

module.exports = RTPStatistics;