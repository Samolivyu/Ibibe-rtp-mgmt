// config/domains.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the .env file located one level up from config/
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Helper to validate and normalize base URLs (removes trailing slashes)
function normalizeUrl(rawUrl, varName) {
  if (!rawUrl) {
    throw new Error(`${varName} missing in .env`);
  }
  return rawUrl.replace(/\/+$/, '');
}

export default {
  playtest: {
    companyName: 'Play Test Platform',
    // Base URLs
    loginUrl: normalizeUrl(process.env.PLAY_TEST_LOGIN_URL, 'PLAY_TEST_LOGIN_URL'),
    apiBaseUrl: normalizeUrl(process.env.PLAY_TEST_API_BASE_URL, 'PLAY_TEST_API_BASE_URL'),
    gameBaseUrl: normalizeUrl(process.env.PLAY_TEST_GAME_BASE_URL, 'PLAY_TEST_GAME_BASE_URL'),

    // Test User Credentials
    username: process.env.PLAY_TEST_USERNAME,
    password: process.env.PLAY_TEST_PASSWORD,
    testUserId: process.env.PLAY_TEST_USER_ID || 'test-player-playtest-001', // New: Specific test user ID
    currency: process.env.PLAY_TEST_CURRENCY || 'USD', // New: Currency for test user

    // API Endpoints
    gameListEndpoint: process.env.PLAY_TEST_GAME_LIST_ENDPOINT || '/operator-proxy/get-client-games', // Updated based on screenshot
    rtpEndpoint: process.env.PLAY_TEST_RTP_ENDPOINT || '/operator-proxy/get-user-rtp', // Updated based on screenshot
    sessionCreationEndpoint: process.env.PLAY_TEST_SESSION_CREATION_ENDPOINT || '/operator-proxy/create-session', // New: For game sessions
    
    // Authentication & Headers
    headers: {
      'Accept': 'application/json',
      'X-API-Key': process.env.PLAY_TEST_ADMIN_API_KEY, // Admin API key for direct calls
    },
    // New: PlayTest specific authentication/signature requirements
    auth: {
      method: 'POST', // Login via POST
      tokenType: 'bearer', // Assuming bearer token after login
      signatureRequired: true, // Example: if API requires a signature for requests
      signatureKey: process.env.PLAY_TEST_SIGNATURE_KEY, // Key for signature generation
      // Add other auth specific config if needed
    },

    // Swagger
    swaggerUrl: process.env.SWAGGER_URL_PLAYTEST || '',
    
    // Rate Limiting
    rateLimit: {
      requestsPerSecond: parseInt(process.env.PLAY_TEST_RPS || '', 10) || 5
    },
  },

  casinoclient: {
    companyName: 'Casino Client Platform',
    // Base URLs
    loginUrl: normalizeUrl(process.env.CASINO_CLIENT_LOGIN_URL, 'CASINO_CLIENT_LOGIN_URL'),
    apiBaseUrl: normalizeUrl(process.env.CASINO_CLIENT_API_BASE_URL, 'CASINO_CLIENT_API_BASE_URL'),
    gameBaseUrl: normalizeUrl(process.env.CASINO_CLIENT_GAME_BASE_URL, 'CASINO_CLIENT_GAME_BASE_URL'),

    // Test User Credentials
    username: process.env.CASINO_CLIENT_USERNAME,
    password: process.env.CASINO_CLIENT_PASSWORD,
    testUserId: process.env.CASINO_CLIENT_USER_ID || 'test-player-casinoclient-001', // New: Specific test user ID
    currency: process.env.CASINO_CLIENT_CURRENCY || 'EUR', // New: Currency for test user

    // API Endpoints
    gameListEndpoint: process.env.CASINO_CLIENT_GAME_LIST_ENDPOINT || '/api/v1/games', // Default from your files
    rtpEndpoint: process.env.CASINO_CLIENT_RTP_ENDPOINT || '/api/v1/user-rtp', // Default from your files
    sessionCreationEndpoint: process.env.CASINO_CLIENT_SESSION_CREATION_ENDPOINT || '/api/v1/game-sessions', // New: For game sessions

    // Authentication & Headers
    headers: {
      'Accept': 'application/json',
      'X-API-Key': process.env.CASINO_CLIENT_ADMIN_API_KEY || '', // Admin API key for direct calls
    },
    // New: CasinoClient specific authentication requirements
    auth: {
      method: 'GET', // Login via GET (less common, but possible)
      tokenType: 'queryParam', // Example: if token is passed as query param
      tokenParamName: 'auth_token', // Name of the query parameter
      // Add other auth specific config if needed
    },

    // Swagger
    swaggerUrl: process.env.SWAGGER_URL_CASINOCLIENT || '',

    // Rate Limiting
    rateLimit: {
      requestsPerSecond: parseInt(process.env.CASINO_CLIENT_RPS || '', 10) || 10
    },
  }
};