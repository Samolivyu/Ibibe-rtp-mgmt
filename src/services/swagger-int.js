// src/services/swagger-integration.js
const SwaggerClient = require('swagger-client');
const { log, logError } = require('../utils');
const { SWAGGER_SPEC_URL, SWAGGER_ENVIRONMENTS } = require('../config/api-config');

class SwaggerIntegration {
    constructor(environment = 'dev') {
        this.environment = environment;
        this.client = null;
        this.config = SWAGGER_ENVIRONMENTS[environment] || SWAGGER_ENVIRONMENTS.dev;
    }

    async initialize() {
        try {
            this.client = await new SwaggerClient({
                url: SWAGGER_SPEC_URL,
                spec: this.config,
                requestInterceptor: this.requestInterceptor.bind(this),
                responseInterceptor: this.responseInterceptor.bind(this)
            });
            log(`Swagger client initialized for ${this.environment} environment`);
            return this.client;
        } catch (error) {
            logError(error, 'SwaggerIntegration.initialize');
            throw error;
        }
    }

    requestInterceptor(request) {
        // Add API key authentication
        if (!request.headers) request.headers = {};
        request.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        
        // Add environment tag to request
        request.headers['X-Environment'] = this.environment;
        return request;
    }

    responseInterceptor(response) {
        if (response.status >= 400) {
            log(`API Error: ${response.status} ${response.url}`, 'error');
        }
        return response;
    }

    async callEndpoint(operationId, parameters) {
        if (!this.client) await this.initialize();
        
        try {
            const operation = this.client.apis[operationId.split('.')[0]][operationId.split('.')[1]];
            return await operation(parameters);
        } catch (error) {
            logError(error, `SwaggerIntegration.callEndpoint:${operationId}`);
            throw error;
        }
    }

    async runSpinSimulation(gameId, spinCount) {
        return this.callEndpoint('Simulation.startSimulation', {
            gameId,
            body: { spinCount }
        });
    }
}

module.exports = SwaggerIntegration;