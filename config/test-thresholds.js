// config/test.thresholds.js
module.exports = {
  rtp: {
    spinsPerGame: process.env.RTP_TEST_SPINS || 5000,
    batchSize: process.env.RTP_BATCH_SIZE || 500,
    accuracyThreshold: 0.99,
    warningThreshold: 0.97,
    confidenceLevel: 0.95
  },
  execution: {
    maxConcurrentGames: 3,
    gameTimeout: 600000,
    maxRetries: 2
  },
  swagger: {
    endpoints: {
      playtest: {
        rtpValidation: '/api/v1/games/{gameId}/rtp',
        expectedRtp: '/operator-proxy/get-user-rtp'
      },
      casinoclient: {
        rtpValidation: '/api/v1/player-rtp-config/{playerId}',
        expectedRtp: '/api/v1/player-rtp-config/'
      }
    }
  }
};

