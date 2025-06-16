// api/src/clients/api-client.js

const fetch = require('node-fetch'); // Use node-fetch for making HTTP requests
const { API_BASE_URL, API_USERNAME, API_PASSWORD } = process.env;
const API_CLIENT_ID = process.env.API_CLIENT_ID || 'default-api-test-client'; // Default client ID for API tests

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
    constructor(options) {
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
            console.warn("API_BASE_URL is not set in .env or options. Using a fallback, which might not be correct.");
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
                const errorData = await response.json();
                throw new Error(`Login failed: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            this.authToken = data.token;
            this.headers['Authorization'] = `Bearer ${this.authToken}`;
            return data;
        } catch (error) {
            console.error(`Error during API login for client ${this.clientId}:`, error.message);
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
                const errorData = await response.json();
                throw new Error(`Failed to start game session: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            this.sessionId = data.id; // Store the session ID
            return data;
        } catch (error) {
            console.error(`Error starting game session for client ${this.clientId}, game ${gameId}:`, error.message);
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
                const errorData = await response.json();
                throw new Error(`Failed to place bet: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            // Ensure the response contains the shared data model fields
            if (typeof data.betAmount !== 'number' || typeof data.payout !== 'number' || !data.gameId || !data.clientId) {
                console.warn("API response for placeBet is missing expected RTP data fields (betAmount, payout, gameId, clientId).", data);
                // Optionally throw an error or handle gracefully
            }
            return data; // This should contain betAmount, payout, gameId, clientId
        } catch (error) {
            console.error(`Error placing bet for client ${this.clientId}, game ${gameId}, amount ${betAmount}:`, error.message);
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
                const errorData = await response.json();
                throw new Error(`Failed to process payout: ${response.status} - ${errorData.message || response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error processing payout for transaction ${transactionId}:`, error.message);
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
                const errorData = await response.json();
                throw new Error(`Failed to end game session: ${response.status} - ${errorData.message || response.statusText}`);
            }
            this.sessionId = null; // Clear session ID
            return await response.json();
        } catch (error) {
            console.error(`Error ending game session ${this.sessionId}:`, error.message);
            throw error;
        }
    }

    // Add other API methods as needed (e.g., getClientBalance, getBetHistory)
}

module.exports = ApiClient;