import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const domainsConfig = {
  playtest: {
    // Base URL for game platform
    baseUrl: process.env.PLAY_TEST_BASE_URL || 'https://admin-api.ibibe.africa',
    // Endpoint to fetch the game list
    gameListEndpoint: process.env.PLAY_TEST_GAME_LIST_ENDPOINT || '/games',
    // Optional headers (e.g. API keys, auth tokens)
    headers: {
      Accept: 'application/json',
      // 'X-API-Key': process.env.PLAY_TEST_API_KEY,
      // Add other headers here
    },
    // Validation rules for responses
    validation: {
      timeout: Number(process.env.PLAY_TEST_TIMEOUT) || 10000,
      expectedStatusCodes: (process.env.PLAY_TEST_STATUS_CODES
        ? process.env.PLAY_TEST_STATUS_CODES.split(',').map(Number)
        : [200]
      ),
    },
    // Rate limit settings
    rateLimit: {
      requestsPerSecond: Number(process.env.PLAY_TEST_RPS) || 5,
    },
  },

  casinoclient: {
    baseUrl: process.env.CASINO_CLIENT_BASE_URL || 'https://admin-api3.ibibe.africa',
    gameListEndpoint: process.env.CASINO_CLIENT_GAME_LIST_ENDPOINT || '/games',
    headers: {
      Accept: 'application/json',
      // 'X-API-Key': process.env.CASINO_CLIENT_API_KEY,
    },
    validation: {
      timeout: Number(process.env.CASINO_CLIENT_TIMEOUT) || 10000,
      expectedStatusCodes: (process.env.CASINO_CLIENT_STATUS_CODES
        ? process.env.CASINO_CLIENT_STATUS_CODES.split(',').map(Number)
        : [200]
      ),
    },
    rateLimit: {
      requestsPerSecond: Number(process.env.CASINO_CLIENT_RPS) || 10,
    },
  },

  // Add additional platforms here...
};

export default domainsConfig;