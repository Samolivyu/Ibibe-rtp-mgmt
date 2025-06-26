// Load environment variables
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const domainsConfig = {
    // Configuration for the "PLAY TEST" platform
    playtest: {
        companyName: "Play Test Platform",
        // Login details for Playwright's global setup to authenticate
        loginUrl: process.env.PLAY_TEST_LOGIN_URL,
        username: process.env.PLAY_TEST_USERNAME, // Directly use env var here
        password: process.env.PLAY_TEST_PASSWORD, // Directly use env var here

        // API details for fetching game list (used by rtp-valid.spec.js via Playwright's 'request')
        apiBaseUrl: process.env.PLAY_TEST_API_BASE_URL,
        gameListEndpoint: '/api/v1/games', // Common endpoint, adjust if different
        // Headers for API calls (e.g., if a static API key is needed)
        headers: {
            'Accept': 'application/json',
            // 'X-API-Key': process.env.PLAY_TEST_API_KEY // Example: if API uses a fixed key
        },
        // Validation rules for API responses
        validation: {
            timeout: 10000, // Timeout for API calls
            expectedStatusCodes: [200] // Expected HTTP status codes for success
        },
        // Base URL for launching individual games in the browser via Playwright
        gameBaseUrl: process.env.PLAY_TEST_GAME_BASE_URL,
    },
    // Configuration for the "CASINO CLIENT" platform
    casinoclient: {
        companyName: "Casino Client Platform",
        loginUrl: process.env.CASINO_CLIENT_LOGIN_URL,
        username: process.env.CASINO_CLIENT_USERNAME,
        password: process.env.CASINO_CLIENT_PASSWORD,

        apiBaseUrl: process.env.CASINO_CLIENT_API_BASE_URL,
        gameListEndpoint: '/api/v1/games', // Common endpoint, adjust if different
        headers: {
            'Accept': 'application/json',
            // 'X-API-Key': process.env.CASINO_CLIENT_API_KEY
        },
        validation: {
            timeout: 10000,
            expectedStatusCodes: [200]
        },
        gameBaseUrl: process.env.CASINO_CLIENT_GAME_BASE_URL,
    },
    // Add more companies/platforms here following the same structure
    // Example:
    // anotherPlatform: {
    //     companyName: "Another Gaming Platform",
    //     loginUrl: process.env.ANOTHER_PLATFORM_LOGIN_URL,
    //     username: process.env.ANOTHER_PLATFORM_USERNAME,
    //     password: process.env.ANOTHER_PLATFORM_PASSWORD,
    //     apiBaseUrl: process.env.ANOTHER_PLATFORM_API_BASE_URL,
    //     gameListEndpoint: '/api/games',
    //     headers: { 'Accept': 'application/json' },
    //     validation: { timeout: 15000, expectedStatusCodes: [200, 201] },
    //     gameBaseUrl: process.env.ANOTHER_PLATFORM_GAME_BASE_URL,
    // },
};

module.exports = domainsConfig;