import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the .env file located one level up
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default {
  playtest: {
    companyName: "Play Test Platform",
    loginUrl: process.env.PLAY_TEST_LOGIN_URL,
    apiBaseUrl: process.env.PLAY_TEST_API_BASE_URL,
    gameBaseUrl: process.env.PLAY_TEST_GAME_BASE_URL,
    username: process.env.PLAY_TEST_USERNAME,
    password: process.env.PLAY_TEST_PASSWORD,
    swaggerUrl: process.env.SWAGGER_URL_PLAYTEST,
    rateLimit: {
      requestsPerSecond: Number(process.env.PLAY_TEST_RPS) || 5,
    },
    // PlayTest uses operator-proxy endpoints, not /api/v1/games
    gameListEndpoint: '/operator-proxy/get-client-games', // This gets games for a client
    rtpEndpoint: '/operator-proxy/get-user-rtp', // This gets RTP for a user
    headers: {
      'Accept': 'application/json',
      'X-API-Key': process.env.PLAY_TEST_ADMIN_API_KEY || ''
    },
  },
  casinoclient: {
    companyName: "Casino Client Platform",
    loginUrl: process.env.CASINO_CLIENT_LOGIN_URL,
    apiBaseUrl: process.env.CASINO_CLIENT_API_BASE_URL,
    gameBaseUrl: process.env.CASINO_CLIENT_GAME_BASE_URL,
    username: process.env.CASINO_CLIENT_USERNAME,
    password: process.env.CASINO_CLIENT_PASSWORD,
    swaggerUrl: process.env.SWAGGER_URL_CASINOCLIENT,
    rateLimit: {
      requestsPerSecond: Number(process.env.CASINO_CLIENT_RPS) || 10,
    },
    gameListEndpoint: '/api/v1/games', // This should work for casinoclient
    rtpEndpoint: '/api/v1/user-rtp', // This gets RTP configs
    headers: {
      'Accept': 'application/json',
      'X-API-Key': process.env.CASINO_CLIENT_ADMIN_API_KEY || ''
    },
  }
};