// src/tests/api-integration.spec.js
const { test, expect } = require('@playwright/test');
const ApiClient = require('../clients/api-client');
const { SWAGGER_SPEC_URL } = require('../config/api-config');

test.describe('RTP Workflow Integration Tests', () => {
    let apiClient;
    const TEST_GAME_ID = 'test-game-001';
    
    test.beforeEach(async () => {
        apiClient = new ApiClient();
        await apiClient.initSwaggerClient();
        await apiClient.login();
    });
    
    test('RTP update and validation workflow', async () => {
        // Test RTP update
        const newRTP = 95;
        const updateResponse = await apiClient.updateGameRTP(TEST_GAME_ID, newRTP);
        expect(updateResponse.success).toBe(true);
        
        // Test simulation
        const sessionId = await apiClient.runSpinSimulation(TEST_GAME_ID, 100);
        expect(sessionId).toBeTruthy();
        
        // Test results retrieval
        const results = await apiClient.getSimulationResults(sessionId);
        expect(results.length).toBe(100);
        
        // Test validation
        const validation = await apiClient.validateRTPEndpoint(TEST_GAME_ID);
        expect(validation.isValid).toBe(true);
        expect(Math.abs(validation.calculatedRTP - newRTP)).toBeLessThan(1.5);
    });
    
    test('RTP compliance threshold validation', async () => {
        const validation = await apiClient.validateRTPEndpoint(TEST_GAME_ID);
        expect(validation.calculatedRTP).toBeGreaterThanOrEqual(85);
        expect(validation.calculatedRTP).toBeLessThanOrEqual(98);
    });
});