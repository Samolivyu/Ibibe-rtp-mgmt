// config/test-thresholds.js

const thresholds = {
  rtp: {
    spinsPerGame: process.env.RTP_TEST_SPINS ? parseInt(process.env.RTP_TEST_SPINS, 10) : 5000,
    batchSize: process.env.RTP_BATCH_SIZE ? parseInt(process.env.RTP_BATCH_SIZE, 10) : 500,
    accuracyThreshold: 0.99, // 99% accuracy means 1% deviation is allowed (e.g., 96.0 target, 95.0-97.0 range)
    warningThreshold: 0.97,  // For reporting, if RTP falls below this (e.g., 97%)
    confidenceLevel: 0.95,   // For statistical significance (e.g., 95% confidence interval)
    targetRTP: 96.0,         // Default overall target RTP if not game-specific
    tolerance: 0.5,          // Default overall tolerance (e.g., 0.5% deviation from target)
    minSampleSize: 1000,     // Minimum rounds for initial RTP validation
    maxSampleSize: 5000,     // Maximum rounds to consider for RTP stability
  },
  execution: {
    maxConcurrentGames: 3, // Max parallel game tests
    gameTimeout: 600000,   // Max time for a single game's tests (ms)
    maxRetries: 2          // Max retries for failed API calls/spins
  },
  swagger: {
    endpoints: {
      playtest: {
        // Endpoint in Swagger where the expected RTP for PLAY TEST is documented
        // Based on dev.yaml: /api/v1/games/{gameId}/config which has 'rtp' property
        expectedRtp: '/api/v1/games/{gameId}/config'
      },
      casinoclient: {
        // Endpoint in Swagger where the expected RTP for CASINO CLIENT is documented
        // Based on test.yaml: /api/v2/games/{gameId}/settings which has 'returnToPlayer' property
        expectedRtp: '/api/v2/games/{gameId}/settings'
      }
    }
  }
};

// Export the thresholds object as the default export
export default thresholds;