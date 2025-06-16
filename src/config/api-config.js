//Centralised Api settings
// api/src/config/api-config.js

const path = require('path');

const config = {
    // Base URL for the API (can be overridden by .env)
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',

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
    WEBSOCKET_TIMEOUT_MS: 10000,
};

module.exports = config;