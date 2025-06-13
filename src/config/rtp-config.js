/**
 * RTP Configuration Module
 * Defines game-specific RTP targets, tolerances, and validation parameters
 */

class RTPConfig {
  constructor() {
    this.gameConfigs = {
      // Default configuration for all games
      default: {
        targetRTP: 96.0,
        tolerance: 0.5,
        minSampleSize: 1000,
        maxSampleSize: 5000,
        confidenceLevel: 0.95,
        alertThreshold: 1.0,
        criticalThreshold: 2.0
      },
      
      // Game-specific configurations
      "slot-game-001": {
        targetRTP: 95.5,
        tolerance: 0.3,
        minSampleSize: 1500,
        maxSampleSize: 5000,
        confidenceLevel: 0.95,
        alertThreshold: 0.8,
        criticalThreshold: 1.5
      },
      
      "blackjack-001": {
        targetRTP: 99.2,
        tolerance: 0.2,
        minSampleSize: 2000,
        maxSampleSize: 5000,
        confidenceLevel: 0.99,
        alertThreshold: 0.5,
        criticalThreshold: 1.0
      },
      
      "roulette-001": {
        targetRTP: 97.3,
        tolerance: 0.4,
        minSampleSize: 1000,
        maxSampleSize: 4000,
        confidenceLevel: 0.95,
        alertThreshold: 0.7,
        criticalThreshold: 1.2
      }
    };

    this.testingConfig = {
      batchSize: 100,
      delayBetweenBatches: 1000, // ms
      maxRetries: 3,
      timeoutPerRequest: 5000, // ms
      reportingInterval: 500 // Generate interim reports every N spins
    };

    this.postmanConfig = {
      environment: process.env.NODE_ENV || 'development',
      baseURL: process.env.API_BASE_URL || 'https://api.gaming-platform.com',
      authToken: process.env.API_AUTH_TOKEN,
      collectionId: process.env.POSTMAN_COLLECTION_ID
    };
  }

  /**
   * Get configuration for a specific game
   * @param {string} gameId - The game identifier
   * @returns {Object} Game configuration object
   */
  getGameConfig(gameId) {
    return this.gameConfigs[gameId] || this.gameConfigs.default;
  }

  /**
   * Get all game configurations
   * @returns {Object} All game configurations
   */
  getAllGameConfigs() {
    return this.gameConfigs;
  }

  /**
   * Get testing configuration
   * @returns {Object} Testing configuration
   */
  getTestingConfig() {
    return this.testingConfig;
  }

  /**
   * Get Postman configuration
   * @returns {Object} Postman configuration
   */
  getPostmanConfig() {
    return this.postmanConfig;
  }

  /**
   * Validate configuration for a game
   * @param {string} gameId - The game identifier
   * @returns {boolean} True if configuration is valid
   */
  validateGameConfig(gameId) {
    const config = this.getGameConfig(gameId);
    
    return (
      config.targetRTP > 0 && config.targetRTP <= 100 &&
      config.tolerance > 0 && config.tolerance < 10 &&
      config.minSampleSize > 0 && config.minSampleSize <= config.maxSampleSize &&
      config.confidenceLevel > 0 && config.confidenceLevel < 1
    );
  }

  /**
   * Add or update game configuration
   * @param {string} gameId - The game identifier
   * @param {Object} config - Game configuration object
   */
  setGameConfig(gameId, config) {
    this.gameConfigs[gameId] = { ...this.gameConfigs.default, ...config };
  }
}

module.exports = RTPConfig;