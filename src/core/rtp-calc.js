// src/core/rtp-calc.js

/**
 * RTP Calculator - Core calculation and validation engine
 * Handles real-time RTP calculations, statistical analysis, and validation
 */

class RTPCalculator {
  constructor(config) {
    this.config = config;
    this.gameData = new Map(); // Store data per gameId
    this.statistics = new Map(); // Store statistics per gameId
  }

  /**
   * Add game round data for RTP calculation
   * @param {Object} roundData - Single round data {betAmount, payout, gameId, clientId, timestamp}
   */
  addRoundData(roundData) {
    const { gameId, betAmount, payout, clientId } = roundData;
    
    if (!this.gameData.has(gameId)) {
      this.gameData.set(gameId, []);
      this.statistics.set(gameId, this.initializeStatistics());
    }

    const gameRounds = this.gameData.get(gameId);
    const roundWithTimestamp = {
      ...roundData,
      timestamp: roundData.timestamp || Date.now(),
      roundId: `${gameId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    gameRounds.push(roundWithTimestamp);
    this.updateStatistics(gameId, betAmount, payout);
  }

  /**
   * Calculate actual RTP for a specific game
   * @param {string} gameId - Game identifier
   * @returns {Object} RTP calculation results
   */
  calculateActualRTP(gameId) {
    const gameRounds = this.gameData.get(gameId) || [];
    
    if (gameRounds.length === 0) {
      return {
        actualRTP: 0,
        totalBets: 0,
        totalPayouts: 0,
        roundCount: 0,
        isValid: false,
        error: 'No game data available'
      };
    }

    const totalBets = gameRounds.reduce((sum, round) => sum + round.betAmount, 0);
    const totalPayouts = gameRounds.reduce((sum, round) => sum + round.payout, 0);
    const actualRTP = totalBets > 0 ? (totalPayouts / totalBets) * 100 : 0;

    return {
      actualRTP: Number(actualRTP.toFixed(4)),
      totalBets: Number(totalBets.toFixed(2)),
      totalPayouts: Number(totalPayouts.toFixed(2)),
      roundCount: gameRounds.length,
      isValid: totalBets > 0,
      averageBet: Number((totalBets / gameRounds.length).toFixed(2)),
      averagePayout: Number((totalPayouts / gameRounds.length).toFixed(2))
    };
  }

  /**
   * Validate RTP against target with statistical confidence
   * @param {string} gameId - Game identifier
   * @param {number} targetRTP - Target RTP percentage
   * @returns {Object} Validation results
   */
  validateRTP(gameId, targetRTP) {
    const rtpData = this.calculateActualRTP(gameId);
    const gameConfig = this.config.getGameConfig(gameId);
    
    if (!rtpData.isValid) {
      return {
        ...rtpData,
        isValidRTP: false,
        deviation: 0,
        deviationPercent: 0,
        confidence: 0,
        status: 'ERROR',
        message: rtpData.error || 'Invalid RTP data'
      };
    }

    const deviation = Math.abs(rtpData.actualRTP - targetRTP);
    const deviationPercent = (deviation / targetRTP) * 100;
    const confidence = this.calculateStatisticalConfidence(gameId, targetRTP);
    
    let status = 'NORMAL';
    let message = 'RTP within acceptable range';

    if (deviation > gameConfig.criticalThreshold) {
      status = 'CRITICAL';
      message = `RTP deviation (${deviation.toFixed(4)}%) exceeds critical threshold (${gameConfig.criticalThreshold}%)`;
    } else if (deviation > gameConfig.alertThreshold) {
      status = 'WARNING';
      message = `RTP deviation (${deviation.toFixed(4)}%) exceeds alert threshold (${gameConfig.alertThreshold}%)`;
    }

    return {
      ...rtpData,
      targetRTP: targetRTP,
      isValidRTP: deviation <= gameConfig.tolerance,
      deviation: Number(deviation.toFixed(4)),
      deviationPercent: Number(deviationPercent.toFixed(4)),
      confidence: Number(confidence.toFixed(4)),
      status: status,
      message: message,
      thresholds: {
        tolerance: gameConfig.tolerance,
        alertThreshold: gameConfig.alertThreshold,
        criticalThreshold: gameConfig.criticalThreshold
      }
    };
  }

  /**
   * Calculate statistical confidence using standard error
   * @param {string} gameId - Game identifier
   * @param {number} targetRTP - Target RTP percentage
   * @returns {number} Confidence level (0-100)
   */
  calculateStatisticalConfidence(gameId, targetRTP) {
    const gameRounds = this.gameData.get(gameId) || [];
    const stats = this.statistics.get(gameId);
    
    if (!stats || gameRounds.length < 30) {
      return 0; // Not enough data for statistical confidence
    }

    const n = gameRounds.length;
    const variance = stats.variance;
    const standardError = Math.sqrt(variance / n);
    const zScore = Math.abs((stats.meanRTP - targetRTP) / standardError);
    
    // Convert z-score to confidence percentage (simplified)
    const confidence = Math.max(0, Math.min(100, (1 - (zScore / 3)) * 100));
    
    return confidence;
  }

  /**
   * Initialize statistics tracking for a game
   * @returns {Object} Initial statistics object
   */
  initializeStatistics() {
    return {
      meanRTP: 0,
      variance: 0,
      standardDeviation: 0,
      minRTP: Infinity,
      maxRTP: -Infinity,
      sumSquaredDeviations: 0,
      lastUpdated: Date.now()
    };
  }

  /**
   * Update running statistics for a game
   * @param {string} gameId - Game identifier
   * @param {number} betAmount - Bet amount
   * @param {number} payout - Payout amount
   */
  updateStatistics(gameId, betAmount, payout) {
    const stats = this.statistics.get(gameId);
    const gameRounds = this.gameData.get(gameId);
    const n = gameRounds.length;
    
    if (betAmount > 0) {
      const roundRTP = (payout / betAmount) * 100;
      
      // Update min/max
      stats.minRTP = Math.min(stats.minRTP, roundRTP);
      stats.maxRTP = Math.max(stats.maxRTP, roundRTP);
      
      // Update running mean and variance (Welford's online algorithm)
      const oldMean = stats.meanRTP;
      stats.meanRTP = oldMean + (roundRTP - oldMean) / n;
      stats.sumSquaredDeviations += (roundRTP - oldMean) * (roundRTP - stats.meanRTP);
      
      if (n > 1) {
        stats.variance = stats.sumSquaredDeviations / (n - 1);
        stats.standardDeviation = Math.sqrt(stats.variance);
      }
      
      stats.lastUpdated = Date.now();
    }
  }

  /**
   * Get comprehensive game statistics
   * @param {string} gameId - Game identifier
   * @returns {Object} Game statistics
   */
  getGameStatistics(gameId) {
    const stats = this.statistics.get(gameId);
    const gameRounds = this.gameData.get(gameId) || [];
    
    if (!stats || gameRounds.length === 0) {
      return null;
    }

    return {
      gameId: gameId,
      roundCount: gameRounds.length,
      meanRTP: Number(stats.meanRTP.toFixed(4)),
      standardDeviation: Number(stats.standardDeviation.toFixed(4)),
      variance: Number(stats.variance.toFixed(4)),
      minRTP: stats.minRTP === Infinity ? 0 : Number(stats.minRTP.toFixed(4)),
      maxRTP: stats.maxRTP === -Infinity ? 0 : Number(stats.maxRTP.toFixed(4)),
      lastUpdated: new Date(stats.lastUpdated).toISOString()
    };
  }

  /**
   * Clear all data for a specific game
   * @param {string} gameId - Game identifier
   */
  clearGameData(gameId) {
    this.gameData.delete(gameId);
    this.statistics.delete(gameId);
  }

  /**
   * Clear all data for all games
   */
  clearAllData() {
    this.gameData.clear();
    this.statistics.clear();
  }

  /**
   * Get all tracked game IDs
   * @returns {Array} Array of game IDs
   */
  getTrackedGames() {
    return Array.from(this.gameData.keys());
  }

  /**
   * Export game data for external analysis
   * @param {string} gameId - Game identifier
   * @returns {Object} Exportable game data
   */
  exportGameData(gameId) {
    const gameRounds = this.gameData.get(gameId) || [];
    const rtpData = this.calculateActualRTP(gameId);
    const statistics = this.getGameStatistics(gameId);

    return {
      gameId: gameId,
      exportTimestamp: new Date().toISOString(),
      rtpSummary: rtpData,
      statistics: statistics,
      roundData: gameRounds
    };
  }
}

module.exports = RTPCalculator;