// api/src/config/api-schemas.js

// Using JSON Schema Draft 07 for Ajv compatibility
const JSON_SCHEMA_DRAFT = "http://json-schema.org/draft-07/schema#";

// Schema for login request payload
const loginRequestSchema = {
    $id: 'loginRequestSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        clientId: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string' },
    },
    required: ['clientId', 'username', 'password'],
    additionalProperties: false, // Disallow extra properties
};

// Schema for successful login response payload
const loginResponseSchema = {
    $id: 'loginResponseSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        token: { type: 'string' },
        expiresIn: { type: 'number', minimum: 1 },
        // userId: { type: 'string' }, // Example additional field
    },
    required: ['token', 'expiresIn'],
    additionalProperties: false,
};

// Schema for start game session request payload
const startGameSessionRequestSchema = {
    $id: 'startGameSessionRequestSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        gameId: { type: 'string' },
        clientId: { type: 'string' },
    },
    required: ['gameId', 'clientId'],
    additionalProperties: false,
};

// Schema for successful start game session response payload
const startGameSessionResponseSchema = {
    $id: 'startGameSessionResponseSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        id: { type: 'string' }, // Session ID
        gameId: { type: 'string' },
        clientId: { type: 'string' },
        status: { type: 'string', enum: ['active', 'pending', 'ended'] }, // e.g., 'active', 'pending'
        createdAt: { type: 'string', format: 'date-time' }, // ISO 8601 date string
    },
    required: ['id', 'gameId', 'clientId', 'status', 'createdAt'],
    additionalProperties: false,
};

// Schema for place bet request payload
const placeBetRequestSchema = {
    $id: 'placeBetRequestSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        sessionId: { type: 'string' },
        gameId: { type: 'string' },
        clientId: { type: 'string' },
        betAmount: { type: 'number', minimum: 0.01 }, // Minimum bet amount
    },
    required: ['sessionId', 'gameId', 'clientId', 'betAmount'],
    additionalProperties: false,
};

// Schema for successful place bet response payload (Shared Data Model)
const placeBetResponseSchema = {
    $id: 'placeBetResponseSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        betId: { type: 'string' },
        amount: { type: 'number', minimum: 0.01 }, // The betAmount that was placed
        payout: { type: 'number', minimum: 0 }, // The actual payout for this round
        gameId: { type: 'string' },
        clientId: { type: 'string' },
        // transactionId: { type: 'string' }, // Optional: if payout needs separate processing
        // result: { type: 'string' }, // e.g., 'win', 'loss', 'draw'
        // newBalance: { type: 'number' }, // Example: updated client balance
    },
    required: ['betId', 'amount', 'payout', 'gameId', 'clientId'],
    additionalProperties: true, // Allow for potential extra fields like 'transactionId', 'result', etc.
};

// Schema for a successful payout processing response
const processPayoutResponseSchema = {
    $id: 'processPayoutResponseSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        transactionId: { type: 'string' },
        payoutAmount: { type: 'number', minimum: 0 },
        status: { type: 'string', enum: ['completed', 'failed', 'pending'] }, // e.g., 'completed', 'failed'
    },
    required: ['transactionId', 'payoutAmount', 'status'],
    additionalProperties: false,
};

// Schema for a common error response structure
const errorResponseSchema = {
    $id: 'errorResponseSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        message: { type: 'string' },
        code: { type: 'string' }, // e.g., 'INVALID_BET_AMOUNT', 'AUTH_FAILED'
        // details: { type: 'object' },
    },
    required: ['message', 'code'],
    additionalProperties: true,
};

// RTP Validation Schemas
const rtpSimulationRequestSchema = {
    $id: 'rtpSimulationRequestSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        gameId: { type: 'string' },
        spinCount: { type: 'integer', minimum: 1000, maximum: 10000 },
        betAmount: { type: 'number', minimum: 0.01 }
    },
    required: ['gameId', 'spinCount'],
    additionalProperties: false
};

const rtpSimulationResponseSchema = {
    $id: 'rtpSimulationResponseSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        sessionId: { type: 'string' },
        totalSpins: { type: 'integer' },
        totalBet: { type: 'number' },
        totalPayout: { type: 'number' },
        calculatedRTP: { type: 'number', minimum: 0, maximum: 1 }
    },
    required: ['sessionId', 'calculatedRTP'],
    additionalProperties: false
};

const rtpComplianceReportSchema = {
    $id: 'rtpComplianceReportSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        gameId: { type: 'string' },
        expectedRTP: { type: 'number', minimum: 0, maximum: 1 },
        actualRTP: { type: 'number', minimum: 0, maximum: 1 },
        variance: { type: 'number' },
        isCompliant: { type: 'boolean' },
        confidenceLevel: { type: 'number', minimum: 0, maximum: 1 }
    },
    required: ['gameId', 'expectedRTP', 'actualRTP', 'isCompliant'],
    additionalProperties: false
};

// Schema for updating game RTP
const updateGameRTPRequestSchema = {
    $id: 'updateGameRTPRequestSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        gameId: { type: 'string' },
        rtpValue: { type: 'number', minimum: 0, maximum: 1 }
    },
    required: ['gameId', 'rtpValue'],
    additionalProperties: false
};

const updateGameRTPResponseSchema = {
    $id: 'updateGameRTPResponseSchema',
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        gameId: { type: 'string' },
        previousRTP: { type: 'number', minimum: 0, maximum: 1 },
        newRTP: { type: 'number', minimum: 0, maximum: 1 },
        updatedAt: { type: 'string', format: 'date-time' },
        success: { type: 'boolean' }
    },
    required: ['gameId', 'newRTP', 'success'],
    additionalProperties: false
};

// Utility class for schema operations
class SchemaUtils {
    /**
     * Get all RTP validation schemas
     * @returns {object} Object containing all RTP validation schemas
     */
    static getRTPValidationSchemas() {
        return {
            rtpSimulationRequestSchema,
            rtpSimulationResponseSchema,
            rtpComplianceReportSchema,
            updateGameRTPRequestSchema,
            updateGameRTPResponseSchema
        };
    }

    /**
     * Get all API schemas
     * @returns {object} Object containing all API schemas
     */
    static getAllSchemas() {
        return {
            loginRequestSchema,
            loginResponseSchema,
            startGameSessionRequestSchema,
            startGameSessionResponseSchema,
            placeBetRequestSchema,
            placeBetResponseSchema,
            processPayoutResponseSchema,
            errorResponseSchema,
            ...this.getRTPValidationSchemas()
        };
    }

    /**
     * Get schema by ID
     * @param {string} schemaId - The schema ID to retrieve
     * @returns {object|null} The schema object or null if not found
     */
    static getSchemaById(schemaId) {
        const allSchemas = this.getAllSchemas();
        return Object.values(allSchemas).find(schema => schema.$id === schemaId) || null;
    }
}

module.exports = {
    // Core API schemas
    loginRequestSchema,
    loginResponseSchema,
    startGameSessionRequestSchema,
    startGameSessionResponseSchema,
    placeBetRequestSchema,
    placeBetResponseSchema,
    processPayoutResponseSchema,
    errorResponseSchema,
    
    // RTP validation schemas
    rtpSimulationRequestSchema,
    rtpSimulationResponseSchema,
    rtpComplianceReportSchema,
    updateGameRTPRequestSchema,
    updateGameRTPResponseSchema,
    
    // Utility class
    SchemaUtils,
    
    // Constants
    JSON_SCHEMA_DRAFT
};