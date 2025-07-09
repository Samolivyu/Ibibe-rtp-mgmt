// 📁 api/src/config/test-thresholds.js
import 'dotenv/config';

const thresholds = {
  rtp: {
    spinsPerGame: parseInt(process.env.RTP_TEST_SPINS || '5000', 10),
    batchSize: parseInt(process.env.RTP_BATCH_SIZE || '500', 10),
    accuracyThreshold: 0.99,
    warningThreshold: 0.97,
    confidenceLevel: 0.95,
    targetRTP: 96.0,
    tolerance: 0.5,
    minSampleSize: 5000,
    maxSampleSize: 12000
  },
  execution: {
    maxConcurrentGames: 3,
    gameTimeout: 600000, // 10 minutes
    maxRetries: 2
  },
  swagger: {
    endpoints: {
      playtest: {
        expectedRtp: '/operator-proxy/get-user-rtp' // ✅ from playapi.yaml
      },
      casinoclient: {
        expectedRtp: '/api/v1/player-rtp-config' // ✅ confirmed from Swagger UI
      }
    }
  }
};

export default thresholds;
