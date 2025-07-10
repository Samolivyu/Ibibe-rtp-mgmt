import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from ../.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Loaded environment variables:', process.env);

// Fail fast for required PLAY_TEST environment variables
[
  'PLAY_TEST_LOGIN_URL',
  'PLAY_TEST_API_BASE_URL',
  'PLAY_TEST_USERNAME',
  'PLAY_TEST_PASSWORD',
  'PLAY_TEST_ADMIN_API_KEY'
].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`${key} is required`);
  }
});

// Fail fast for required CASINO_CLIENT environment variables
[
  'CASINO_CLIENT_LOGIN_URL',
  'CASINO_CLIENT_API_BASE_URL',
  'CASINO_CLIENT_USERNAME',
  'CASINO_CLIENT_PASSWORD',
  'CASINO_CLIENT_ADMIN_API_KEY'
].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`${key} is required`);
  }
});

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
    loginUrl: process.env.PLAY_TEST_LOGIN_URL,
    apiBaseUrl: process.env.PLAY_TEST_API_BASE_URL,
    gameBaseUrl: process.env.PLAY_TEST_GAME_BASE_URL || '',
    username: process.env.PLAY_TEST_USERNAME,
    password: process.env.PLAY_TEST_PASSWORD,
    swaggerUrl: process.env.SWAGGER_URL_PLAYTEST || '',
    rateLimit: {
      requestsPerSecond: parseInt(process.env.PLAY_TEST_RPS || '', 10) || 5
    },
    gameListEndpoint: '/operator-proxy/get-client-games',
    rtpEndpoint: '/operator-proxy/get-user-rtp',
    headers: {
      Accept: 'application/json',
      'X-API-Key': process.env.PLAY_TEST_ADMIN_API_KEY
    },
    get validatedUrl() {
      return normalizeUrl(this.apiBaseUrl, 'PLAY_TEST_API_BASE_URL');
    },
    get validatedGameUrl() {
      return normalizeUrl(this.gameBaseUrl, 'PLAY_TEST_GAME_BASE_URL');
    }
  },

  casinoclient: {
    companyName: 'Casino Client Platform',
    loginUrl: process.env.CASINO_CLIENT_LOGIN_URL || '',
    apiBaseUrl: process.env.CASINO_CLIENT_API_BASE_URL || '',
    gameBaseUrl: process.env.CASINO_CLIENT_GAME_BASE_URL || '',
    username: process.env.CASINO_CLIENT_USERNAME || '',
    password: process.env.CASINO_CLIENT_PASSWORD || '',
    swaggerUrl: process.env.SWAGGER_URL_CASINOCLIENT || '',
    rateLimit: {
      requestsPerSecond: parseInt(process.env.CASINO_CLIENT_RPS || '', 10) || 10
    },
    gameListEndpoint: '/api/v1/games',
    rtpEndpoint: '/api/v1/user-rtp',
    headers: {
      Accept: 'application/json',
      'X-API-Key': process.env.CASINO_CLIENT_ADMIN_API_KEY || ''
    },
    get validatedUrl() {
      return normalizeUrl(this.apiBaseUrl, 'CASINO_CLIENT_API_BASE_URL');
    },
    get validatedGameUrl() {
      return normalizeUrl(this.gameBaseUrl, 'CASINO_CLIENT_GAME_BASE_URL');
    }
  }
};