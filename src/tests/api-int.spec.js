// api/tests/api-integration.spec.js

const { test, expect } = require('@playwright/test');
const ApiClient = require('../src/clients/api-client');
const ApiValid = require('../src/validation/api-valid'); // Corrected import
const { log } = require('../src/utils');
const { DEFAULT_CLIENT_ID, DEFAULT_USERNAME, DEFAULT_PASSWORD, API_BASE_URL } = require('../src/config/api-config');

test.describe('API Integration Tests', () => {
    let apiClient;
    let apiValidator; // Instance of the validator
    let authToken;
    let sessionId;

    // Initialize API client and validator before all tests in this describe block
    test.beforeAll(async () => {
        apiClient = new ApiClient({
            baseURL: API_BASE_URL,
            clientId: DEFAULT_CLIENT_ID,
            username: DEFAULT_USERNAME,
            password: DEFAULT_PASSWORD,
        });
        apiValidator = new ApiValid(); // Initialize the validator

        log(`API_BASE_URL: ${API_BASE_URL}`, 'info');

        try {
            const loginResponse = await apiClient.login();
            const loginValidation = apiValidator.validateLoginResponse(loginResponse); // Use instance
            expect(loginValidation.isValid).toBe(true, `Login response validation failed: ${loginValidation.errors.join(', ')}`);
            authToken = loginResponse.token;
            log('API client successfully logged in for integration tests.', 'success');

            const startGameResponse = await apiClient.startGameSession('integration-test-game-01');
            const startGameValidation = apiValidator.validateStartGameSessionResponse(startGameResponse); // Use instance
            expect(startGameValidation.isValid).toBe(true, `Start game session response validation failed: ${startGameValidation.errors.join(', ')}`);
            sessionId = startGameResponse.id;
            log(`Game session started: ${sessionId}`, 'success');

        } catch (error) {
            log(`Failed to set up API client or start session in beforeAll: ${error.message}`, 'error');
            throw error;
        }
    });

    // Clean up after all tests (e.g., end session)
    test.afterAll(async () => {
        if (sessionId) {
            try {
                await apiClient.endGameSession();
                log(`Game session ${sessionId} ended successfully.`, 'success');
            } catch (error) {
                log(`Failed to end game session ${sessionId}: ${error.message}`, 'error');
            }
        }
    });

    test('should successfully log in and validate token response', async ({ request }) => {
        const response = await request.post(`${API_BASE_URL}/auth/login`, {
            data: {
                clientId: DEFAULT_CLIENT_ID,
                username: DEFAULT_USERNAME,
                password: DEFAULT_PASSWORD,
            },
        });
        expect(response.status()).toBe(200);
        const data = await response.json();
        const validation = apiValidator.validateLoginResponse(data); // Use instance
        expect(validation.isValid).toBe(true, `Login response validation failed: ${validation.errors.join(', ')}`);
        expect(data).toHaveProperty('token');
        expect(data).toHaveProperty('expiresIn');
    });

    test('should successfully start a game session and validate response', async ({ request }) => {
        expect(authToken).not.toBeNull();
        const gameId = 'integration-test-game-02';
        const response = await request.post(`${API_BASE_URL}/game/start`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { gameId, clientId: DEFAULT_CLIENT_ID },
        });
        expect(response.status()).toBe(200);
        const data = await response.json();
        const validation = apiValidator.validateStartGameSessionResponse(data); // Use instance
        expect(validation.isValid).toBe(true, `Start game session response validation failed: ${validation.errors.join(', ')}`);
        expect(data).toHaveProperty('id');
        expect(data.gameId).toBe(gameId);
        expect(data.status).toBe('active');
    });

    test('should successfully place a bet and validate response (Shared Data Model)', async ({ request }) => {
        expect(sessionId).not.toBeNull();
        expect(authToken).not.toBeNull();

        const betAmount = 10;
        const response = await request.post(`${API_BASE_URL}/bet/place`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                sessionId: sessionId,
                gameId: 'integration-test-game-01',
                clientId: DEFAULT_CLIENT_ID,
                betAmount: betAmount,
            },
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        const validation = apiValidator.validatePlaceBetResponse(data); // Use instance
        expect(validation.isValid).toBe(true, `Place bet response validation failed: ${validation.errors.join(', ')}`);

        expect(data).toHaveProperty('betId');
        expect(data.amount).toBe(betAmount);
        expect(data).toHaveProperty('payout');
        expect(typeof data.payout).toBe('number');
        expect(data.payout).toBeGreaterThanOrEqual(0);
        expect(data.gameId).toBe('integration-test-game-01');
        expect(data.clientId).toBe(DEFAULT_CLIENT_ID);

        log(`Bet placed. Payout: ${data.payout}`, 'info');
    });

    test('should handle invalid bet amount gracefully', async ({ request }) => {
        expect(sessionId).not.toBeNull();
        expect(authToken).not.toBeNull();

        const invalidBetAmount = -5; // Example of invalid data

        const response = await request.post(`${API_BASE_URL}/bet/place`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                sessionId: sessionId,
                gameId: 'integration-test-game-01',
                clientId: DEFAULT_CLIENT_ID,
                betAmount: invalidBetAmount,
            },
        });

        expect(response.status()).toBe(400); // Expect a client error status code (e.g., 400 Bad Request)
        const errorData = await response.json();
        const validation = apiValidator.validateErrorResponse(errorData); // Use instance for error schema
        expect(validation.isValid).toBe(true, `Error response validation failed: ${validation.errors.join(', ')}`);
        expect(errorData.message).toContain('Invalid bet amount');
    });
});