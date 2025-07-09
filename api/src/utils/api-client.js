import 'dotenv/config';
import axios from 'axios';
import rlModule from 'axios-rate-limit';
import config from '../../config/domains.js';
import { log, logError } from './logger.js';

const clients = {};

// Initialize clients based on domains config
Object.entries(config).forEach(([company, cfg]) => {
  const instance = axios.create({ baseURL: cfg.apiBaseUrl, timeout: cfg.timeout, headers: cfg.headers });
  clients[company] = cfg.rateLimit
    ? (rlModule.default || rlModule)(instance, {
        maxRequests: cfg.rateLimit.requestsPerSecond,
        perMilliseconds: 1000
      })
    : instance;
});

// Fetch list of games for a company
export async function getGames(company) {
  const { gameListEndpoint, headers } = config[company];
  const client = clients[company];

  try {
    log(`Fetching games for ${company} from endpoint: ${gameListEndpoint}`, 'info');
    let response;
    if (company === 'playtest') {
      response = await client.post(gameListEndpoint, {}, { headers });
    } else {
      response = await client.get(gameListEndpoint, { headers });
    }

    // Debug log
    log(`API Response: endpoint=${gameListEndpoint} status=${response.status}`, 'debug');
    console.debug('API Response data:', response.data);

    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.games)) return data.games;
    if (Array.isArray(data.data?.games)) return data.data.games;
    return [];
  } catch (error) {
    logApiError(error, company, 'getGames');
    return [];
  }
}

// Fetch RTP for a user/game
export async function getUserRTP(company, userId) {
  const { rtpEndpoint, headers } = config[company];
  const client = clients[company];

  try {
    log(`Fetching RTP for ${company} user ${userId}`, 'info');
    const response = company === 'playtest'
      ? await client.post(rtpEndpoint, { userId }, { headers })
      : await client.get(rtpEndpoint, { headers });

    log(`API Response: endpoint=${rtpEndpoint} status=${response.status}`, 'debug');
    return response.data;
  } catch (error) {
    logApiError(error, company, 'getUserRTP');
    throw error;
  }
}

// Send simulated spins
export async function executeSpinBatch(spinData) {
  const client = clients[spinData.company];
  try {
    const response = await client.post('/api/v1/games/spin', spinData);
    log(`Spin batch sent for company=${spinData.company} gameId=${spinData.gameId}`, 'debug');
    return response.data;
  } catch (error) {
    logApiError(error, spinData.company, 'executeSpinBatch');
    throw error;
  }
}

// Helper: API error logger
function logApiError(error, company, context = 'API') {
  if (error.response) {
    const attempted = `${error.config.baseURL}${error.config.url}`;
    logError(`${context} error (${attempted}): ${error.response.status}`, company);
    console.error(JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    logError(`${context} no response received`, company);
  } else {
    logError(`${context} failure: ${error.message || error}`, company);
  }
}