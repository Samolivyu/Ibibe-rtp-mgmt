import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import config from '../../config/domains.js';
import { log, logError } from './logger.js';

const DEFAULT_TIMEOUT = 5000;
const clients = {};

// Initialize axios clients with optional rate limiting
Object.entries(config).forEach(([company, cfg]) => {
  const instance = axios.create({
    baseURL: cfg.apiBaseUrl,
    timeout: cfg.timeout || DEFAULT_TIMEOUT,
    headers: cfg.headers
  });

  clients[company] = cfg.rateLimit
    ? rateLimit(instance, {
        maxRequests: cfg.rateLimit.requestsPerSecond,
        perMilliseconds: 1000
      })
    : instance;
});

// Helper: centralized API error logging
function logApiError(error, context) {
  const tag = context || 'API';
  if (error.response) {
    const attempted = error.config && `${error.config.baseURL}${error.config.url}`;
    logError(`${tag} error (${attempted || 'unknown endpoint'}): ${error.response.status}`, tag);
    console.error(JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    logError(`${tag} no response received`, tag);
  } else {
    logError(`${tag} failure: ${error.message}`, tag);
  }
}

// Fetch list of games for a company
export async function getGames(company) {
  const { gameListEndpoint, headers } = config[company];
  const client = clients[company];

  if (!client.defaults.baseURL) {
    logError(`Missing baseURL for ${company}`, 'config');
    return [];
  }

  try {
    log(`Fetching games for ${company} from ${client.defaults.baseURL}${gameListEndpoint}`, 'info');
    const response = company === 'playtest'
      ? await client.post(gameListEndpoint, {}, { headers })
      : await client.get(gameListEndpoint, { headers });

    if (!response.data) {
      throw new Error('Empty response received');
    }

    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.games)) return data.games;
    if (Array.isArray(data.results)) return data.results;

    log(`Unexpected response format for ${company} games`, 'warn');
    logError(`Response keys: ${Object.keys(data).join(', ')}`, 'warn');
    return [];
  } catch (err) {
    logApiError(err, 'getGames');
    return [];
  }
}

// Fetch RTP for a user (and optional game)
export async function getUserRTP(company, userId, gameId = null) {
  const { rtpEndpoint, headers } = config[company];
  const client = clients[company];

  try {
    // Build endpoint for each platform
    let response;
    if (company === 'playtest') {
      log(`Fetching RTP (playtest) for user ${userId}${gameId ? ` game ${gameId}` : ''}`, 'info');
      response = await client.post(rtpEndpoint, { userId, gameId }, { headers });
    } else {
      const url = gameId
        ? `${rtpEndpoint}/${userId}?gameId=${gameId}`
        : `${rtpEndpoint}/${userId}`;
      log(`Fetching RTP (casinoclient) for user ${userId}${gameId ? ` game ${gameId}` : ''}`, 'info');
      response = await client.get(url, { headers });
    }

    if (!response.data || typeof response.data.rtp === 'undefined') {
      throw new Error('Invalid RTP response structure');
    }

    const rtpValue = parseFloat(response.data.rtp);
    if (isNaN(rtpValue)) {
      throw new Error(`Invalid RTP value: ${response.data.rtp}`);
    }

    return { ...response.data, rtp: rtpValue };
  } catch (err) {
    logApiError(err, 'getUserRTP');
    throw err;
  }
}

// Send simulated spins
export async function executeSpinBatch(spinData) {
  const client = clients[spinData.company];
  try {
    const response = await client.post('/api/v1/games/spin', spinData);
    log(`Spin batch sent for company=${spinData.company} gameId=${spinData.gameId}`, 'debug');
    return response.data || [];
  } catch (err) {
    logApiError(err, 'executeSpinBatch');
    throw err;
  }
}

// Authenticate a user and retrieve a token
export async function loginUser(company, username, password) {
  const { loginUrl, headers } = config[company];
  const client = clients[company];

  try {
    log(`Authenticating ${username} on ${company}`, 'info');
    const response = await client.post(loginUrl, { username, password }, { headers });

    if (!response.data?.user?.id || !response.data?.token) {
      throw new Error('Invalid login response structure');
    }

    return {
      userId: response.data.user.id,
      token: response.data.token
    };
  } catch (err) {
    logApiError(err, 'loginUser');
    throw new Error(`Authentication failed: ${err.message}`);
  }
}