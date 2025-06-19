// api/src/clients/api-client.js

const fetch = require('node-fetch'); // Use node-fetch for making HTTP requests
const { API_BASE_URL, API_USERNAME, API_PASSWORD } = process.env;
const API_CLIENT_ID = process.env.API_CLIENT_ID || 'default-api-test-client'; // Default client ID for API tests
const SwaggerClient = require('swagger-client');
const { log } = require('../utils');
const { SWAGGER_SPEC_URL, RATE_LIMIT_CONFIG } = require('../config/api-config');

/**
 * GameAPIClient: Handles all interactions with the Gaming API.
 * This class abstracts away HTTP requests, authentication, and session management.
 * @param {object} options - Configuration options for the API client.
 * @param {string} options.baseURL - The base URL of the Gaming API.
 * @param {string} options.clientId - The ID of the client to simulate.
 * @param {string} [options.username] - Username for authentication (if applicable).
 * @param {string} [options.password] - Password for authentication (if applicable).
 */
class ApiClient {
    constructor(options = {}) {
        this.baseURL = options.baseURL || API_BASE_URL;
        this.clientId = options.clientId || API_CLIENT_ID;
        this.username = options.username || API_USERNAME;
        this.password = options.password || API_PASSWORD;
        this.authToken = null;
        this.sessionId = null; // Represents the active game session
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        this.requestOptions = {
            timeout: 15000, // 15 seconds timeout for API calls
        };

        if (!this.baseURL) {
            log("API_BASE_URL is not set in .env or options. Using a fallback, which might not be correct.", 'warn');
        }

        this.swaggerClient = null;
        this.rateLimit = {
            remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS,
            resetTime: Date.now() + RATE_LIMIT_CONFIG.PER_MINUTE * 60000
        };
    }

    /**
     * Request interceptor for rate limiting and logging
     * @param {object} request - The request object
     * @returns {Promise<object>} The modified request object
     */
    async _requestInterceptor(request) {
        log(`Request: ${request.method} ${request.url}`, 'debug');
        
        // Rate limiting check
        if (this.rateLimit.remaining <= 0 && Date.now() < this.rateLimit.resetTime) {
            const waitTime = Math.ceil((this.rateLimit.resetTime - Date.now()) / 1000);
            log(`Rate limit exceeded. Waiting ${waitTime} seconds`, 'warn');
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            
            // Reset rate limit after waiting
            this.rateLimit.remaining = RATE_LIMIT_CONFIG.MAX_REQUESTS;
            this.rateLimit.resetTime = Date.now() + RATE_LIMIT_CONFIG.PER_MINUTE * 60000;
        }
        
        // Decrement remaining requests
        this.rateLimit.remaining--;
        
        return request;
    }

    /**
     * Response interceptor for logging and rate limit tracking
     * @param {object} response - The response object
     * @returns {object} The response object
     */
    _responseInterceptor(response) {
        log(`Response: ${response.status} ${response.url}`, 'debug');
        
        // Update rate limit from response headers if available
        if (response.headers && response.headers['x-ratelimit-remaining']) {
            this.rateLimit.remaining = parseInt(response.headers['x-ratelimit-remaining']);
        }
        if (response.headers && response.headers['x-ratelimit-reset']) {
            this.rateLimit.resetTime = parseInt(response.headers['x-ratelimit-reset']) * 1000;
        }
        
        return response;
    }

    /**
     * Initialize Swagger client
     * @returns {Promise<object>} The initialized Swagger client
     */
    async initSwaggerClient() {
        try {
            this.swaggerClient = await new SwaggerClient({
                url: SWAGGER_SPEC_URL,
                requestInterceptor: this._requestInterceptor.bind(this),
                responseInterceptor: this._responseInterceptor.bind(this)
            });
            log('Swagger client initialized successfully', 'success');
            return this.swaggerClient;
        } catch (error) {
            log(`Failed to initialize Swagger client: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Update game RTP value
     * @param {string} gameId - The game ID
     * @param {number} newRTP - The new RTP value
     * @returns {Promise<object>} The update response
     */
    async updateGameRTP(gameId, newRTP) {
        if (!this.swaggerClient) {
            throw new Error('Swagger client not initialized. Call initSwaggerClient() first.');
        }
        
        try {
            const response = await this.swaggerClient.apis.Admin.updateGameRTP({
                gameId,
                body: { rtpValue: newRTP }
            });
            return response.body;
        } catch (error) {
            log(`Error updating game RTP for game ${gameId}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Run spin simulation
     * @param {string} gameId - The game ID
     * @param {number} spinCount - Number of spins to simulate
     * @returns {Promise<string>} The simulation session ID
     */
    async runSpinSimulation(gameId, spinCount) {
        if (!this.swaggerClient) {
            throw new Error('Swagger client not initialized. Call initSwaggerClient() first.');
        }
        
        try {
            const response = await this.swaggerClient.apis.Simulation.startSimulation({
                gameId,
                body: { spinCount }
            });
            return response.body.sessionId;
        } catch (error) {
            log(`Error running spin simulation for game ${gameId}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get simulation results
     * @param {string} sessionId - The simulation session ID
     * @returns {Promise<object>} The simulation results
     */
    async getSimulationResults(sessionId) {
        if (!this.swaggerClient) {
            throw new Error('Swagger client not initialized. Call initSwaggerClient() first.');
        }
        
        try {
            const response = await this.swaggerClient.apis.Simulation.getResults({ sessionId });
            return response.body;
        } catch (error) {
            log(`Error getting simulation results for session ${sessionId}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Validate RTP endpoint
     * @param {string} gameId - The game ID
     * @returns {Promise<object>} The validation response
     */
    async validateRTPEndpoint(gameId) {
        if (!this.swaggerClient) {
            throw new Error('Swagger client not initialized. Call initSwaggerClient() first.');
        }
        
        try {
            const response = await this.swaggerClient.apis.Validation.validateRTP({ gameId });
            return response.body;
        } catch (error) {
            log(`Error validating RTP endpoint for game ${gameId}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Authenticates the client and obtains an authorization token.
     * @returns {Promise<object>} The authentication response data (e.g., { token, expiresIn }).
     */
    async login() {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    clientId: this.clientId,
                    username: this.username,
                    password: this.password,
                }),
                ...this.requestOptions,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Login failed: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            this.authToken = data.token;
            this.headers['Authorization'] = `Bearer ${this.authToken}`;
            log(`Login successful for client ${this.clientId}`, 'success');
            return data;
        } catch (error) {
            log(`Error during API login for client ${this.clientId}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Starts a new game session for a given game.
     * @param {string} gameId - The ID of the game to start a session for.
     * @returns {Promise<object>} The game session data (e.g., { id, gameId, status }).
     */
    async startGameSession(gameId) {
        if (!this.authToken) {
            throw new Error('Not authenticated. Please call login() first.');
        }
        
        try {
            const response = await fetch(`${this.baseURL}/game/start`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ gameId, clientId: this.clientId }),
                ...this.requestOptions,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to start game session: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            this.sessionId = data.id; // Store the session ID
            log(`Game session started for client ${this.clientId}, game ${gameId}`, 'success');
            return data;
        } catch (error) {
            log(`Error starting game session for client ${this.clientId}, game ${gameId}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Places a bet in the current game session.
     * @param {string} gameId - The ID of the game the bet is placed in.
     * @param {number} betAmount - The amount of the bet.
     * @returns {Promise<object>} The bet result data ({ betId, amount, payout, gameId, clientId, etc. }).
     * Note: This is the critical method that provides the "Shared Data Model" fields. 
     */
    async placeBet(gameId, betAmount) {
        if (!this.sessionId) {
            throw new Error('No active game session. Please call startGameSession() first.');
        }
        if (!this.authToken) {
            throw new Error('Not authenticated. Please call login() first.');
        }

        try {
            const response = await fetch(`${this.baseURL}/bet/place`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    gameId: gameId,
                    clientId: this.clientId,
                    betAmount: betAmount,
                }),
                ...this.requestOptions,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to place bet: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            
            // Ensure the response contains the shared data model fields
            if (typeof data.betAmount !== 'number' || typeof data.payout !== 'number' || !data.gameId || !data.clientId) {
                log("API response for placeBet is missing expected RTP data fields (betAmount, payout, gameId, clientId).", 'warn');
                log(`Response data: ${JSON.stringify(data)}`, 'debug');
            }
            
            log(`Bet placed for client ${this.clientId}, game ${gameId}, amount ${betAmount}`, 'success');
            return data; // This should contain betAmount, payout, gameId, clientId
        } catch (error) {
            log(`Error placing bet for client ${this.clientId}, game ${gameId}, amount ${betAmount}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Processes a payout for a given transaction.
     * (Optional: if payout is a separate API call after a bet)
     * @param {string} transactionId - The ID of the transaction to process payout for.
     * @returns {Promise<object>} The payout result data ({ payoutAmount, status }).
     */
    async processPayout(transactionId) {
        if (!this.authToken) {
            throw new Error('Not authenticated. Please call login() first.');
        }
        
        try {
            const response = await fetch(`${this.baseURL}/bet/payout/${transactionId}`, {
                method: 'POST', // Or GET, depending on API design
                headers: this.headers,
                ...this.requestOptions,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to process payout: ${response.status} - ${errorData.message || response.statusText}`);
            }
            
            const data = await response.json();
            log(`Payout processed for transaction ${transactionId}`, 'success');
            return data;
        } catch (error) {
            log(`Error processing payout for transaction ${transactionId}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Ends the current game session.
     * @returns {Promise<object>} The session end confirmation.
     */
    async endGameSession() {
        if (!this.sessionId) {
            return { message: 'No active session to end.' };
        }
        if (!this.authToken) {
            throw new Error('Not authenticated.');
        }
        
        try {
            const response = await fetch(`${this.baseURL}/game/end/${this.sessionId}`, {
                method: 'DELETE', // Or POST, depending on API design
                headers: this.headers,
                ...this.requestOptions,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to end game session: ${response.status} - ${errorData.message || response.statusText}`);
            }
            
            const sessionId = this.sessionId;
            this.sessionId = null; // Clear session ID
            const data = await response.json();
            log(`Game session ${sessionId} ended successfully`, 'success');
            return data;
        } catch (error) {
            log(`Error ending game session ${this.sessionId}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Check if client is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return !!this.authToken;
    }

    /**
     * Check if there's an active game session
     * @returns {boolean} Session status
     */
    hasActiveSession() {
        return !!this.sessionId;
    }

    /**
     * Get current rate limit status
     * @returns {object} Rate limit information
     */
    getRateLimitStatus() {
        return {
            remaining: this.rateLimit.remaining,
            resetTime: this.rateLimit.resetTime,
            resetIn: Math.max(0, Math.ceil((this.rateLimit.resetTime - Date.now()) / 1000))
        };
    }
}

module.exports = ApiClient;