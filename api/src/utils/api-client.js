// api/src/utils/api-client.js
import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import config from '../../config/domains.js';
import { log, logError } from './logger.js';

const DEFAULT_TIMEOUT = 15000; // Increased default timeout for API calls
const clients = {};           // Stores axios instances per company
const authTokens = {};        // Stores authentication tokens per company

// Helper for generating a simple signature (replace with actual complex logic if needed)
function generateSignature(payload, secretKey) {
  if (!secretKey) return '';
  const dataString = JSON.stringify(payload);
  return btoa(dataString + secretKey);
}

// New helper to detect HTML responses
function isHtmlResponse(response) {
  const contentType = response.headers['content-type'] || '';
  return contentType.includes('text/html');
}

// Initialize axios clients with optional rate limiting and base URLs
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

  log(`Initialized API client for ${company} with base URL: ${cfg.apiBaseUrl}`, 'debug');
});

/**
 * Helper: centralized API error logging
 */
function logApiError(error, context) {
  const tag = context || 'API';
  if (error.response) {
    const attemptedUrl = error.config && `${error.config.baseURL}${error.config.url}`;
    logError(
      `${tag} error (${attemptedUrl || 'unknown endpoint'}): ` +
      `${error.response.status} ${error.response.statusText}`,
      tag
    );
    console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    logError(`${tag} no response received`, tag);
    console.error('Request config:', error.config);
  } else {
    logError(`${tag} failure: ${error.message}`, tag);
  }
}

/**
 * Authenticates a user for a given company.
 * Stores the token for subsequent requests.
 */
export async function loginUser(company, username, password) {
  const { loginUrl, auth } = config[company];
  const client = clients[company];

  try {
    log(`Authenticating ${username} on ${company}`, 'info');
    const requestHeaders = {
      ...client.defaults.headers.common,
      'Content-Type': 'application/json'
    };
    const response = await client.post(
      loginUrl,
      { username, password },
      { headers: requestHeaders }
    );

    // Check for unexpected HTML response (login endpoint misconfigured)
    if (isHtmlResponse(response)) {
      throw new Error('Received HTML response - check login endpoint');
    }

    // Flexible response parsing
    let userId, token;
    if (response.data.access_token) {
      // Case 1: Standard JWT response
      token = response.data.access_token;
      userId = response.data.user_id || username;
    } else if (response.data.user) {
      // Case 2: Custom user object
      userId = response.data.user.id;
      token = response.data.token;
    } else if (response.data.token) {
      // Case 3: Simple token field
      token = response.data.token;
      userId = username;
    } else {
      throw new Error('Invalid login response structure');
    }

    authTokens[company] = token;
    log(`Authentication successful for ${username}`, 'success');
    return { userId, token };
  } catch (error) {
    // Enhanced error logging
    if (error.response) {
      logError(`Login failed: ${error.response.status} ${error.response.statusText}`, 'loginUser');
      console.error('Response data:', error.response.data);
    } else {
      logError(`Login error: ${error.message}`, 'loginUser');
    }
    throw new Error(`Authentication failed for ${company}: ${error.message}`);
  }
}

/**
 * Creates a game session for a user.
 * @param {string} company - Company key.
 * @param {string} userId - ID of the authenticated user.
 * @param {string} gameId - ID of the game to create a session for.
 * @param {string} currency - Currency for the session.
 * @returns {Promise<Object>} Session details (e.g., session URL, session ID).
 */
export async function createSession(company, userId, gameId, currency) {
  const { sessionCreationEndpoint, auth } = config[company];
  const client = clients[company];
  const token = authTokens[company];

  if (!token) {
    throw new Error(`No authentication token found for ${company}. Please login first.`);
  }

  try {
    log(`Creating session for user ${userId} in game ${gameId} on ${company}`, 'info');
    let response;
    let requestHeaders = { ...client.defaults.headers };

    // Add token to headers or query params based on auth config
    if (auth.tokenType === 'bearer') {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    } else if (auth.tokenType === 'customHeader') {
      requestHeaders[auth.tokenHeaderName] = token;
    }

    const payload = {
      user_id: userId,
      game_id: gameId,
      currency: currency,
      // Add other session creation parameters as per API docs
      return_url: 'http://localhost:3000/game-return' // Example return URL
    };

    // Add signature if required for session creation
    if (auth.signatureRequired && auth.signatureKey) {
      requestHeaders['X-Signature'] = generateSignature(payload, auth.signatureKey);
    }

    response = await client.post(sessionCreationEndpoint, payload, { headers: requestHeaders });

    // Adapt to common session response structures
    const sessionUrl = response.data?.game_url || response.data?.session_url || response.data?.url;
    const sessionId = response.data?.session_id || response.data?.id;

    if (!sessionUrl || !sessionId) {
      throw new Error('Invalid session creation response structure: missing session URL or ID');
    }

    log(`Session created for ${gameId}. Session URL: ${sessionUrl}`, 'success');
    return { sessionUrl, sessionId };
  } catch (err) {
    logApiError(err, `createSession:${company}`);
    throw new Error(`Failed to create session for ${company}: ${err.message}`);
  }
}

/**
 * Fetches list of games for a company.
 * Handles different HTTP methods (GET/POST) and response data structures.
 * @param {string} company - Company key.
 * @returns {Promise<Array<Object>>} Array of game objects ({ id, name }).
 */
export async function getGames(company) {
  const companyConfig = config[company];
  const client = clients[company];
  const token = authTokens[company]; // Get stored token

  if (!client.defaults.baseURL) {
    logError(`Missing baseURL for ${company}`, 'getGames:config');
    return [];
  }
  if (!companyConfig.gameListEndpoint) {
    logError(`Missing gameListEndpoint for ${company}`, 'getGames:config');
    return [];
  }

  try {
    let requestHeaders = { ...companyConfig.headers }; // Start with configured headers

    // Add token to headers or query params based on auth config
    if (token) {
      if (companyConfig.auth.tokenType === 'bearer') {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      } else if (companyConfig.auth.tokenType === 'customHeader') {
        requestHeaders[companyConfig.auth.tokenHeaderName] = token;
      }
      // For queryParam token type, it would be added directly to the URL below
    }

    log(`Fetching games for ${company} from ${client.defaults.baseURL}${companyConfig.gameListEndpoint}`, 'info');

    let response;
    if (company === 'playtest') {
      // PlayTest uses POST for game list (as per screenshot suggestion)
      let payload = {};
      if (companyConfig.auth.signatureRequired && companyConfig.auth.signatureKey) {
        requestHeaders['X-Signature'] = generateSignature(payload, companyConfig.auth.signatureKey);
      }
      response = await client.post(companyConfig.gameListEndpoint, payload, { headers: requestHeaders });
    } else {
      // CasinoClient uses GET for game list
      let url = companyConfig.gameListEndpoint;
      if (companyConfig.auth.tokenType === 'queryParam' && token && companyConfig.auth.tokenParamName) {
        url += `?${companyConfig.auth.tokenParamName}=${token}`;
      }
      response = await client.get(url, { headers: requestHeaders });
    }

    if (!response.data) {
      throw new Error('Empty response received for game list');
    }

    // Adapt to various response data structures
    let games = [];
    if (Array.isArray(response.data)) {
      games = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      games = response.data.data;
    } else if (response.data.games && Array.isArray(response.data.games)) {
      games = response.data.games;
    } else if (response.data.results && Array.isArray(response.data.results)) {
      games = response.data.results;
    } else {
      log(`Unexpected response format for ${company} games. Keys: ${Object.keys(response.data).join(', ')}`, 'warn');
      logError(`Raw response: ${JSON.stringify(response.data)}`, 'debug');
      return [];
    }

    // Map to a consistent { id, name } format
    const mappedGames = games.map(game => ({
      id: game.id || game.game_id, // Use game_id if id is not present
      name: game.game_title || game.name || `Game ${game.id || game.game_id}`
    }));

    log(`Successfully fetched ${mappedGames.length} games for ${company}`, 'info');
    return mappedGames;
  } catch (err) {
    logApiError(err, 'getGames');
    return []; // Return empty array on error to prevent crashes downstream
  }
}

/**
 * Fetches RTP for a user (and optional game).
 * @param {string} company - Company key.
 * @param {string} userId - User ID.
 * @param {string} gameId - Optional game ID.
 * @returns {Promise<Object>} RTP data.
 */
export async function getUserRTP(company, userId, gameId = null) {
  const { rtpEndpoint, auth } = config[company];
  const client = clients[company];
  const token = authTokens[company];

  if (!token) {
    throw new Error(`No authentication token found for ${company}. Please login first.`);
  }

  try {
    let response;
    let requestHeaders = { ...client.defaults.headers };

    // Add token to headers or query params based on auth config
    if (auth.tokenType === 'bearer') {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    } else if (auth.tokenType === 'customHeader') {
      requestHeaders[auth.tokenHeaderName] = token;
    }

    if (company === 'playtest') {
      log(`Fetching RTP (playtest) for user ${userId}${gameId ? ` game ${gameId}` : ''}`, 'info');
      const payload = { user_id: userId, game_id: gameId }; // Assume POST with body
      if (auth.signatureRequired && auth.signatureKey) {
        requestHeaders['X-Signature'] = generateSignature(payload, auth.signatureKey);
      }
      response = await client.post(rtpEndpoint, payload, { headers: requestHeaders });
    } else {
      let url = `${rtpEndpoint}/${userId}`;
      if (gameId) url += `?gameId=${gameId}`;
      if (auth.tokenType === 'queryParam' && token && auth.tokenParamName) {
        url += `${gameId ? '&' : '?'}${auth.tokenParamName}=${token}`;
      }
      log(`Fetching RTP (casinoclient) for user ${userId}${gameId ? ` game ${gameId}` : ''}`, 'info');
      response = await client.get(url, { headers: requestHeaders });
    }

    if (!response.data || typeof response.data.rtp === 'undefined') {
      throw new Error('Invalid RTP response structure: missing rtp property');
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

/**
 * Sends simulated spins to the API.
 * @param {Object} spinData - Contains company, gameId, spins (count), clientId, betAmount.
 * @returns {Promise<Array<Object>>} Array of spin results ({ betAmount, payout, ... }).
 */
export async function executeSpinBatch(spinData) {
  const client = clients[spinData.company];
  const token = authTokens[spinData.company];
  const { auth } = config[spinData.company];

  if (!token) {
    logError(`No authentication token found for ${spinData.company} to execute spin batch.`, 'executeSpinBatch');
    return [];
  }

  try {
    let requestHeaders = { ...client.defaults.headers };
    if (auth.tokenType === 'bearer') {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    } else if (auth.tokenType === 'customHeader') {
      requestHeaders[auth.tokenHeaderName] = token;
    }

    const payload = {
      game_id: spinData.gameId,
      client_id: spinData.clientId,
      bet_amount: spinData.betAmount,
      num_spins: spinData.spins // API might expect a count of spins
      // Add other spin parameters like currency, etc.
    };

    if (auth.signatureRequired && auth.signatureKey) {
      requestHeaders['X-Signature'] = generateSignature(payload, auth.signatureKey);
    }

    log(`Sending ${spinData.spins} spins for game ${spinData.gameId} on ${spinData.company}`, 'debug');
    // Assuming a generic /api/v1/games/spin endpoint for both, adjust if different
    const response = await client.post('/api/v1/games/spin', payload, { headers: requestHeaders });

    // API response for spins should contain an array of individual spin results
    if (response.data && Array.isArray(response.data.rounds)) {
      return response.data.rounds;
    } else if (response.data && Array.isArray(response.data)) {
      return response.data; // Direct array of rounds
    } else {
      logError(new Error('Unexpected response format for spin batch.'), `executeSpinBatch:${spinData.company}`);
      return [];
    }
  } catch (err) {
    logApiError(err, 'executeSpinBatch');
    throw new Error(`Failed to execute spin batch for ${spinData.company}: ${err.message}`);
  }
}

/**
 * Generates a game URL for direct browser access.
 * @param {string} company - Company key.
 * @param {string} gameId - Game ID.
 * @param {string} sessionId - Session ID obtained from createSession.
 * @returns {string} The full game URL.
 */
export function generateGameUrl(company, gameId, sessionId) {
  const { gameBaseUrl } = config[company];
  if (!gameBaseUrl) {
    logError(`Missing gameBaseUrl for ${company}`, 'generateGameUrl');
    return '';
  }
  // This is a generic example. Actual game URLs vary widely.
  // It might involve query parameters, path segments, or a full redirect from session creation.
  return `${gameBaseUrl}/launch?gameId=${gameId}&sessionId=${sessionId}`;
}