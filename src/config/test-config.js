// src/config/test-config.js
module.exports = {
    // Simulation parameters
    DEFAULT_SPIN_COUNT: 5000,
    BATCH_SIZE: 100,
    MAX_CONCURRENT_SIMULATIONS: 5,
    
    // Validation thresholds
    RTP_VALIDATION_THRESHOLD: 1.0, // 1% variance allowed
    STATISTICAL_CONFIDENCE: 0.95, // 95% confidence level
    
    // Retry policies
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 5000,
    
    // Timeouts
    API_TIMEOUT_MS: 30000,
    SIMULATION_TIMEOUT_MS: 600000, // 10 minutes
    
    // Environment mappings
    ENVIRONMENT_MAP: {
        local: 'dev',
        development: 'dev',
        staging: 'staging',
        production: 'prod'
    },
    
    // Result storage
    RESULTS_DIR: './results',
    MAX_RESULTS_AGE_DAYS: 30
};