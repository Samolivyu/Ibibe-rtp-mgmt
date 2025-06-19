//Centralised Api settings
// api/src/config/api-config.js

const path = require('path');

const config = {
    // Base URL for the API (can be overridden by .env)
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rtp-testing',

    // Default credentials for API client tests
    DEFAULT_USERNAME: process.env.API_USERNAME || 'testuser',
    DEFAULT_PASSWORD: process.env.API_PASSWORD || 'testpass',
    DEFAULT_CLIENT_ID: process.env.API_CLIENT_ID || 'api-test-client-001',

    // Request timeouts (in milliseconds)
    REQUEST_TIMEOUT_MS: 15000,

    // Paths for test data or reports
    API_TEST_DATA_PATH: path.resolve(__dirname, '../../data/api-test-data.json'),
    API_REPORT_PATH: path.resolve(__dirname, '../../reports/api-report.json'),

    // Load test settings
    LOAD_TEST_CONFIG: {
        NUM_CONCURRENT_CLIENTS: 20,
        DURATION_SECONDS: 120, // 2 minutes
        GAME_ID: 'load-test-slot-01',
        BET_AMOUNT: 5,
    },

    // WebSocket settings (if applicable)
    WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'ws://localhost:3000/ws',
    WEBSOCKET_TIMEOUT_MS: 1000000,


  // Swagger integration
    SWAGGER_SPEC_URL: process.env.SWAGGER_SPEC_URL || 'https://api.example.com/swagger.json',
    SWAGGER_ENVIRONMENTS: {
        dev: {
            baseUrl: 'http://localhost:3000',
            apiKey: process.env.SWAGGER_DEV_API_KEY || 'dev-key'
        },
        staging: {
            baseUrl: 'https://staging.api.example.com',
            apiKey: process.env.SWAGGER_STAGING_API_KEY || 'staging-key'
        },
        prod: {
            baseUrl: 'https://api.example.com',
            apiKey: process.env.SWAGGER_PROD_API_KEY || 'prod-key'
        }
    },
    
    // Rate limiting
    RATE_LIMIT_CONFIG: {
        MAX_REQUESTS: 100,
        PER_MINUTE: 1
    },
    
    // Simulation defaults
    SIMULATION_DEFAULTS: {
        SPIN_COUNT: 5000,
        BATCH_SIZE: 100,
        TIMEOUT_MS: 300000 // 5 minutes
    },
    
    // Validation thresholds
    VALIDATION_THRESHOLDS: {
        RTP_MIN: 85,
        RTP_MAX: 98,
        ACCEPTABLE_VARIANCE: 1.5
    }

};

module.exports = config;