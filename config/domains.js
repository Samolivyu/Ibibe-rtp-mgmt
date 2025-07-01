// config/domains.js
// This file centralizes configuration for different game platforms/companies.
// It loads sensitive data from .env and provides structure for each platform.

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const domainsConfig = {
    // Configuration for the "PLAY TEST" platform
    playtest: {
        companyName: "Play Test Platform", // This is used in logs for clarity
        // Login details for Playwright's global setup to authenticate
        loginUrl: process.env.PLAY_TEST_LOGIN_URL,
        username: process.env.PLAY_TEST_USERNAME,
        password: process.env.PLAY_TEST_PASSWORD,

        // API details for fetching game list (used by rtp-valid.spec.js via Playwright's 'request')
        apiBaseUrl: process.env.PLAY_TEST_API_BASE_URL || 'https://admin-api.ibibe.africa', // Base URL for API calls
        gameListEndpoint: process.env.PLAY_TEST_GAME_LIST_ENDPOINT || '/api/v1/games', // Specific endpoint for game list API
        // Headers for API calls (e.g., if a static API key is needed)
        headers: {
            'Accept': 'application/json',
            // 'X-API-Key': process.env.PLAY_TEST_API_KEY // Example: if API uses a fixed key
        },
        // Validation rules for API responses
        validation: {
            timeout: Number(process.env.PLAY_TEST_TIMEOUT) || 10000,
            expectedStatusCodes: (process.env.PLAY_TEST_STATUS_CODES
                ? process.env.PLAY_TEST_STATUS_CODES.split(',').map(Number)
                : [200]
            ),
        },
        // Base URL for launching individual games in the browser via Playwright
        // This is the frontend URL where games are typically launched from (e.g., dashboard, game lobby)
        gameBaseUrl: process.env.PLAY_TEST_GAME_BASE_URL || 'https://playgamestest.ibibe.cloud',
        
        // Rate limit settings (primarily for direct API client usage, not Playwright's request context)
        rateLimit: {
            requestsPerSecond: Number(process.env.PLAY_TEST_RPS) || 5,
        },
    },

    // Configuration for the "CASINO CLIENT" platform
    casinoclient: {
        companyName: "Casino Client Platform", // This is used in logs for clarity
        loginUrl: process.env.CASINO_CLIENT_LOGIN_URL,
        username: process.env.CASINO_CLIENT_USERNAME,
        password: process.env.CASINO_CLIENT_PASSWORD,

        apiBaseUrl: process.env.CASINO_CLIENT_API_BASE_URL || 'https://admin-api3.ibibe.africa',
        gameListEndpoint: process.env.CASINO_CLIENT_GAME_LIST_ENDPOINT || '/api/v1/games',
        headers: {
            'Accept': 'application/json',
        },
        validation: {
            timeout: Number(process.env.CASINO_CLIENT_TIMEOUT) || 10000,
            expectedStatusCodes: (process.env.CASINO_CLIENT_STATUS_CODES
                ? process.env.CASINO_CLIENT_STATUS_CODES.split(',').map(Number)
                : [200]
            ),
        },
        gameBaseUrl: process.env.CASINO_CLIENT_GAME_BASE_URL || 'https://casino.client.ibibe.africa',
        rateLimit: {
            requestsPerSecond: Number(process.env.CASINO_CLIENT_RPS) || 10,
        },
    },

    // Add additional platforms here...
};

export default domainsConfig;
