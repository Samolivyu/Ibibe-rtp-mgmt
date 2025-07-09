import RTPUtils from '../scripts/rtp-index.js';
import RTPCalculator from './rtp-calc.js';

export default class RTPStatistics {
    constructor(config = {}) {
        this.config = {
            overallTargetRTP: config.overallTargetRTP || 96.0,
            overallTolerance: config.overallTolerance || 0.5,
            criticalToleranceFactor: config.criticalToleranceFactor || 2,
            minRoundsForRTPValidation: config.minRoundsForRTPValidation || 100,
            maxLosingStreak: config.maxLosingStreak || 50,
            gameSpecificRTPs: config.gameSpecificRTPs || {},
            ...config
        };

        this.rtpCalculator = new RTPCalculator({
            targetRTP: this.config.overallTargetRTP,
            tolerance: this.config.overallTolerance,
            minSampleSize: this.config.minRoundsForRTPValidation
        });

        this.gameRounds = [];
        this.rtpHistory = [];
        this.criticalErrors = [];
        this.totalBets = 0;
        this.totalPayouts = 0;
        this.perGameStats = {};
        this.perClientStats = {};
    }

    addGameRound(gameRound) {
        if (!gameRound || typeof gameRound.betAmount !== 'number' || typeof gameRound.payout !== 'number' || !gameRound.gameId || !gameRound.clientId) {
            RTPUtils.log('Invalid or incomplete game round data provided to RTPStatistics.', 'warn');
            return;
        }

        this.gameRounds.push(gameRound);
        this.totalBets += gameRound.betAmount;
        this.totalPayouts += gameRound.payout;

        if (!this.perGameStats[gameRound.gameId]) {
            this.perGameStats[gameRound.gameId] = { totalBets: 0, totalPayouts: 0, rounds: 0, currentLosingStreak: 0 };
        }
        this.perGameStats[gameRound.gameId].totalBets += gameRound.betAmount;
        this.perGameStats[gameRound.gameId].totalPayouts += gameRound.payout;
        this.perGameStats[gameRound.gameId].rounds++;

        if (!this.perClientStats[gameRound.clientId]) {
            this.perClientStats[gameRound.clientId] = { totalBets: 0, totalPayouts: 0, rounds: 0, currentLosingStreak: 0 };
        }
        this.perClientStats[gameRound.clientId].totalBets += gameRound.betAmount;
        this.perClientStats[gameRound.clientId].totalPayouts += gameRound.payout;
        this.perClientStats[gameRound.clientId].rounds++;

        this._trackLosingStreaks(gameRound);
    }

    _trackLosingStreaks(gameRound) {
        const isLoss = gameRound.payout < gameRound.betAmount;

        if (isLoss) {
            this.perClientStats[gameRound.clientId].currentLosingStreak++;
        } else {
            if (this.perClientStats[gameRound.clientId].currentLosingStreak >= this.config.maxLosingStreak) {
                 this._flagCriticalError(
                    `Losing Streak Anomaly for Client '${gameRound.clientId}'`,
                    `Client experienced ${this.perClientStats[gameRound.clientId].currentLosingStreak} consecutive losses, exceeding max allowed (${this.config.maxLosingStreak}).`
                );
            }
            this.perClientStats[gameRound.clientId].currentLosingStreak = 0;
        }

        if (isLoss) {
            this.perGameStats[gameRound.gameId].currentLosingStreak++;
        } else {
            this.perGameStats[gameRound.gameId].currentLosingStreak = 0;
        }
    }

    snapshotRTP() {
        if (this.gameRounds.length < this.config.minRoundsForRTPValidation) return;

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

        for (const gameId in this.perGameStats) {
            const gameStats = this.perGameStats[gameId];
            if (gameStats.rounds >= this.config.minRoundsForRTPValidation) {
                const gameSpecificTargetRTP = this.config.gameSpecificRTPs[gameId] || this.config.overallTargetRTP;
                const gameDataForRTP = [{ betAmount: gameStats.totalBets, payout: gameStats.totalPayouts }];
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

        for (const clientId in this.perClientStats) {
            const clientStats = this.perClientStats[clientId];
            if (clientStats.rounds >= this.config.minRoundsForRTPValidation) {
                const clientDataForRTP = [{ betAmount: clientStats.totalBets, payout: clientStats.totalPayouts }];
                const clientRTP = this.rtpCalculator.calculateActualRTP(clientDataForRTP);
                const clientDeviation = Math.abs(clientRTP - this.config.overallTargetRTP);

                if (clientDeviation > this.config.overallTolerance * 3) {
                    this._flagCriticalError(
                        `Client RTP Anomaly for '${clientId}'`,
                        `Actual RTP ${clientRTP.toFixed(2)}% vs Overall Target ${this.config.overallTargetRTP.toFixed(2)}% (Deviation: ${clientDeviation.toFixed(2)}%) after ${clientStats.rounds} rounds.`
                    );
                }
            }
        }
    }

    _flagCriticalError(type, message) {
        this.criticalErrors.push({
            type: type,
            roundCount: this.gameRounds.length,
            message: message,
            timestamp: new Date().toISOString()
        });
        RTPUtils.log(`${type}: ${message}`, 'error');
    }

    generateReport() {
        const finalOverallRTP = this.getCurrentCumulativeRTP();
        const finalOverallDeviation = Math.abs(finalOverallRTP - this.config.overallTargetRTP);
        const isFinalOverallRTPValid = finalOverallDeviation <= this.config.overallTolerance;

        const perGameSummary = {};
        for (const gameId in this.perGameStats) {
            const stats = this.perGameStats[gameId];
            const gameRTP = (stats.totalBets > 0) ? (stats.totalPayouts / stats.totalBets) * 100 : 0;
            perGameSummary[gameId] = {
                rounds: stats.rounds,
                actualRTP: gameRTP.toFixed(2) + '%',
                targetRTP: (this.config.gameSpecificRTPs[gameId] || this.config.overallTargetRTP).toFixed(2) + '%',
                losingStreak: stats.currentLosingStreak
            };
        }

        const perClientSummary = {};
        for (const clientId in this.perClientStats) {
            const stats = this.perClientStats[clientId];
            const clientRTP = (stats.totalBets > 0) ? (stats.totalPayouts / stats.totalBets) * 100 : 0;
            perClientSummary[clientId] = {
                rounds: stats.rounds,
                actualRTP: clientRTP.toFixed(2) + '%',
                losingStreak: stats.currentLosingStreak
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
            rtpHistorySnapshots: this.rtpHistory,
            perGameSummary: perGameSummary,
            perClientSummary: perClientSummary,
        };
    }

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