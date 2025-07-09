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
      return { actualRTP: 0, totalBets: 0, totalPayouts: 0, roundCount: 0 };
    }

    let totalBets = 0;
    let totalPayouts = 0;

    for (const round of gameRounds) {
      totalBets += round.betAmount;
      totalPayouts += round.payout;
    }

    const actualRTP = totalBets === 0 ? 0 : (totalPayouts / totalBets) * 100;
    return { actualRTP: Number(actualRTP.toFixed(4)), totalBets, totalPayouts, roundCount: gameRounds.length };
  }

  /**
   * Static method to calculate RTP from an array of spin results.
   * This is what you specifically requested to be static.
   * @param {Array<Object>} spinResults - Array of spin objects, each with 'betAmount' and 'payout'.
   * @returns {number} The calculated RTP as a percentage.
   */
  static calculateRTP(spinResults) {
    if (!spinResults || spinResults.length === 0) {
      return 0;
    }

    let totalBets = 0;
    let totalPayouts = 0;

    for (const spin of spinResults) {
      totalBets += spin.betAmount;
      totalPayouts += spin.payout;
    }

    return totalBets === 0 ? 0 : (totalPayouts / totalBets) * 100;
  }

  /**
   * Validate RTP against a target and tolerance
   * @param {number} actualRTP - Calculated actual RTP
   * @param {number} targetRTP - Target RTP
   * @param {number} tolerance - Allowed deviation
   * @returns {boolean} True if RTP is within tolerance
   */
  validateRTP(actualRTP, targetRTP, tolerance) {
    return Math.abs(actualRTP - targetRTP) <= tolerance;
  }

  /**
   * Initialize statistics object for a new game
   * @returns {Object} Initial statistics object
   */
  initializeStatistics() {
    return {
      totalBets: 0,
      totalPayouts: 0,
      roundCount: 0,
      rtpValues: [], // To store individual round RTPs for standard deviation
      meanRTP: 0,
      standardDeviation: 0,
      variance: 0,
      minRTP: Infinity,
      maxRTP: -Infinity,
      currentLosingStreak: 0,
      longestLosingStreak: 0,
      lastUpdated: Date.now()
    };
  }

  /**
   * Update real-time statistics for a game
   * @param {string} gameId - Game identifier
   * @param {number} betAmount - Bet amount for the current round
   * @param {number} payout - Payout for the current round
   */
  updateStatistics(gameId, betAmount, payout) {
    const stats = this.statistics.get(gameId);
    if (!stats) return;

    stats.totalBets += betAmount;
    stats.totalPayouts += payout;
    stats.roundCount++;

    const roundRTP = betAmount === 0 ? 0 : (payout / betAmount) * 100;
    stats.rtpValues.push(roundRTP);

    // Update mean, min, max
    stats.meanRTP = stats.totalBets === 0 ? 0 : (stats.totalPayouts / stats.totalBets) * 100;
    stats.minRTP = Math.min(stats.minRTP, roundRTP);
    stats.maxRTP = Math.max(stats.maxRTP, roundRTP);

    // Update losing streak
    if (payout < betAmount) { // Assuming a loss if payout is less than bet
      stats.currentLosingStreak++;
    } else {
      stats.currentLosingStreak = 0;
    }
    stats.longestLosingStreak = Math.max(stats.longestLosingStreak, stats.currentLosingStreak);

    // Calculate standard deviation and variance (can be computationally intensive for every round, consider intervals)
    if (stats.roundCount >= 2) {
      const mean = stats.rtpValues.reduce((sum, val) => sum + val, 0) / stats.rtpValues.length;
      const squaredDifferences = stats.rtpValues.map(val => Math.pow(val - mean, 2));
      stats.variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / (stats.rtpValues.length - 1);
      stats.standardDeviation = Math.sqrt(stats.variance);
    }

    stats.lastUpdated = Date.now();
  }

  /**
   * Get current statistics for a specific game
   * @param {string} gameId - Game identifier
   * @returns {Object|null} Current statistics or null if not found
   */
  getStatistics(gameId) {
    const stats = this.statistics.get(gameId);
    if (!stats) return null;

    // Return a copy to prevent external modification
    return {
      gameId: gameId,
      roundCount: stats.roundCount,
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
    const rtpStats = this.getStatistics(gameId);
    return {
      gameId,
      config: this.config,
      rounds: gameRounds,
      statistics: rtpStats
    };
  }
}

export default RTPCalculator;