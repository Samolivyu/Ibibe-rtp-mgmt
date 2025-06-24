const axios = require('axios');
const { log, logError } = require('./logger');

// Try different import patterns for axios-rate-limit
let rateLimit;
try {
  // Try default export first
  rateLimit = require('axios-rate-limit');
  
  // If it's an object with default property, use that
  if (rateLimit && typeof rateLimit.default === 'function') {
    rateLimit = rateLimit.default;
  }
  
  // If it's still not a function, try the named export
  if (typeof rateLimit !== 'function') {
    const rateLimitModule = require('axios-rate-limit');
    rateLimit = rateLimitModule.rateLimit || rateLimitModule;
  }
} catch (error) {
  logError(error, 'Failed to import axios-rate-limit, rate limiting will be disabled');
  rateLimit = null;
}

const config = require('../../config/domains');

// Create rate-limited clients for each company
const clients = {};
Object.keys(config).forEach(company => {
  try {
    if (rateLimit && typeof rateLimit === 'function') {
      // Create rate-limited client
      clients[company] = rateLimit(axios.create(), {
        maxRequests: config[company].rateLimit.requestsPerSecond,
        perMilliseconds: 1000
      });
      log(`Created rate-limited client for ${company} (${config[company].rateLimit.requestsPerSecond} req/sec)`, 'debug');
    } else {
      // Fallback to regular axios client
      clients[company] = axios.create();
      log(`Created regular axios client for ${company} (rate limiting disabled)`, 'warn');
    }
  } catch (error) {
    logError(error, `Failed to create client for ${company}, using fallback`);
    clients[company] = axios.create();
  }
});

module.exports = {
 async getGames(company) {
  const { baseUrl, gameListEndpoint, headers, validation } = config[company];
  const client = clients[company];
  
  const fullUrl = `${baseUrl}${gameListEndpoint}`;
  log(`Fetching games from: ${fullUrl}`, 'debug');
  
  try {
    const response = await client.get(fullUrl, {
      headers,
      timeout: validation.timeout,
      validateStatus: status => validation.expectedStatusCodes.includes(status)
    });
    
    log(`Response status: ${response.status}`, 'debug');
    if (response.data) {
      log(`Response data keys: ${Object.keys(response.data)}`, 'debug');
    }
    
    if (!response.data) {
      throw new Error('Empty response data');
    }
    
    let games;
    if (response.data.games) {
      games = response.data.games;
    } else if (Array.isArray(response.data)) {
      games = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      games = response.data.data;
    } else {
      throw new Error('Invalid games response format - no games array found');
    }
    
    log(`Fetched ${games.length} games for ${company}`, 'success');
    return games;
    
  } catch (error) {
    
    // Enhanced error logging with full response details
    if (error.response) {
      console.error('=== API ERROR DETAILS ===');
      console.error(`Status: ${error.response.status}`);
      console.error(`Status Text: ${error.response.statusText}`);
      console.error(`URL: ${fullUrl}`);
      console.error(`Headers Sent:`, headers);
      console.error(`Response Headers:`, error.response.headers);
      console.error(`Response Data:`, JSON.stringify(error.response.data, null, 2));
      
      logError(`API Error: ${error.response.status} ${error.response.statusText}`, 
               `getGames for ${company}`);
      logError(`Full response: ${JSON.stringify(error.response.data)}`, 'debug');
    } else if (error.request) {
      console.error('=== NETWORK ERROR ===');
      console.error('No response received');
      console.error(`URL: ${fullUrl}`);
      console.error(`Request config:`, error.config);
      
      logError(`Network Error: No response received`, `getGames for ${company}`);
    } else {
      console.error('=== GENERAL ERROR ===');
      console.error(`Error: ${error.message}`);
      logError(error, `getGames for ${company}`);
    }
    throw new Error(`Failed to get games for ${company}: ${error.message}`);
  }
}
};