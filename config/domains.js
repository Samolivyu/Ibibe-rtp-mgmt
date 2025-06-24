// config/domains.js
require('dotenv').config();

module.exports = {
  playtest: {
    baseUrl: 'https://sandbox.ibibe.cloud',

    // Keep RTP management endpoints separate for RTP-specific operations
    authEndpoint: '/api/auth/login',
    authRequired: false,
    
    headers: { 
      'Content-Type': 'application/json',
      'X-Admin-Key': 'admin_key_123'
    },
    
    rateLimit: {
      requestsPerSecond: 10,
      burstLimit: 50
    },
    validation: {
      timeout: 30000,
      retryAttempts: 3,
      expectedStatusCodes: [200, 201]
    },
    
    // Keep RTP Management as separate configuration
    rtpManagement: {
      setUserRtpEndpoint: '/operator-proxy/set-user-rtp',
      setUserRtpBatchEndpoint: '/operator-proxy/set-user-rtp-batch',
      getUserRtpEndpoint: '/operator-proxy/get-user-rtp',
      
      headers: {
        'X-Admin-Key': 'admin_key_123',
        'Content-Type': 'application/json'
      },
    }
  },
  
  casinoclient: {
    baseUrl: 'https://casino.client.ibibe.africa',
    gameListEndpoint: '/api/v1/all/games',
    gamePlayEndpoint: '/api/v1/play',
    authEndpoint: '/api/v1/auth/login',
    authRequired: true,
    headers: {
      'User-Agent': 'RTP-Validator/1.0',
      'Content-Type': 'application/json'
    },
    credentials: {
      username: process.env.CASINOCLIENT_USERNAME,
      password: process.env.CASINOCLIENT_PASSWORD
    },
    rateLimit: {
      requestsPerSecond: 15,
      burstLimit: 75
    },
    validation: {
      timeout: 25000,
      retryAttempts: 2,
      expectedStatusCodes: [200]
    }
  }
};