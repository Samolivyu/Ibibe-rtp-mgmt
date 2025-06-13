// src/utils/index.js
/**
 * Utility functions for the RTP component.
 */

class RTPUtils {
    /**
     * Generates a random number within a specified range.
     * @param {number} min - The minimum value (inclusive).
     * @param {number} max - The maximum value (inclusive).
     * @returns {number} A random number.
     */
    static getRandomNumber(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Simple logger function.
     * @param {string} message - The message to log.
     * @param {string} type - The type of log (e.g., 'info', 'warn', 'error').
     */
    static log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    }

    /**
     * Calculates the standard deviation of an array of numbers.
     * @param {number[]} data - An array of numbers.
     * @returns {number} The standard deviation.
     */
    static calculateStandardDeviation(data) {
        if (data.length < 2) return 0;
        const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
        const squaredDifferences = data.map(value => Math.pow(value - mean, 2));
        const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / (data.length - 1);
        return Math.sqrt(variance);
    }
}

module.exports = RTPUtils;