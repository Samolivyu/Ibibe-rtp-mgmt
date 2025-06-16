// api/src/validation/api-valid.js

const Ajv = require('ajv'); // Import Ajv library
const ajv = new Ajv({ allErrors: true, verbose: true }); // Initialize Ajv with options for detailed errors
const apiSchemas = require('../config/api-schemas'); // Import predefined schemas

/**
 * ApiValidator: Provides methods for validating API request and response data against defined schemas using Ajv.
 * Renamed from ApiValidator to match 'api-valid.js'
 */
class ApiValid { // Renamed class to ApiValid
    constructor() {
        // Compile all predefined schemas for faster validation
        for (const key in apiSchemas) {
            try {
                ajv.addSchema(apiSchemas[key], key); // Add schema with its key as ID
            } catch (error) {
                console.error(`Failed to add schema ${key}:`, error.message);
            }
        }
    }

    /**
     * Validates an object against a given schema.
     * @param {object} data - The object to validate.
     * @param {object|string} schema - The schema object or the ID string of the schema (from api-schemas.js).
     * @returns {object} - { isValid: boolean, errors: array }
     */
    validate(data, schema) {
        let validateFn;
        if (typeof schema === 'string') {
            validateFn = ajv.getSchema(schema);
            if (!validateFn) {
                return { isValid: false, errors: [`Schema '${schema}' not found.`] };
            }
        } else {
            // Compile on the fly if schema object is passed directly (less efficient for repeated use)
            try {
                validateFn = ajv.compile(schema);
            } catch (error) {
                return { isValid: false, errors: [`Schema compilation failed: ${error.message}`] };
            }
        }

        const isValid = validateFn(data);
        return {
            isValid: isValid,
            errors: validateFn.errors ? validateFn.errors.map(err => {
                // Return a more readable error message
                return `Data${err.instancePath} ${err.message}. Schema path: ${err.schemaPath}`;
            }) : [],
        };
    }

    /**
     * Validates a login request payload.
     * @param {object} payload - The login request data.
     * @returns {object} - Validation result.
     */
    validateLoginRequest(payload) {
        return this.validate(payload, 'loginRequestSchema');
    }

    /**
     * Validates a login response payload.
     * @param {object} payload - The login response data.
     * @returns {object} - Validation result.
     */
    validateLoginResponse(payload) {
        return this.validate(payload, 'loginResponseSchema');
    }

    /**
     * Validates a place bet request payload.
     * @param {object} payload - The place bet request data.
     * @returns {object} - Validation result.
     */
    validatePlaceBetRequest(payload) {
        return this.validate(payload, 'placeBetRequestSchema');
    }

    /**
     * Validates a place bet response payload.
     * @param {object} payload - The place bet response data.
     * @returns {object} - Validation result.
     */
    validatePlaceBetResponse(payload) {
        return this.validate(payload, 'placeBetResponseSchema');
    }

    // Add validation methods for other API endpoints as needed
    validateStartGameSessionResponse(payload) {
        return this.validate(payload, 'startGameSessionResponseSchema');
    }

    validateErrorResponse(payload) {
        return this.validate(payload, 'errorResponseSchema');
    }
}

module.exports = ApiValid;