//Logging util. 
// api/src/utils/index.js

const chalk = require('chalk'); // Optional: for colored console output

const log = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    let prefix = '';

    switch (type) {
        case 'info':
            prefix = chalk.blue('[INFO]');
            break;
        case 'success':
            prefix = chalk.green('[SUCCESS]');
            break;
        case 'warn':
            prefix = chalk.yellow('[WARN]');
            break;
        case 'error':
            prefix = chalk.red('[ERROR]');
            break;
        case 'debug':
            prefix = chalk.magenta('[DEBUG]');
            break;
        default:
            prefix = '[LOG]';
    }
    console.log(`${prefix} [${timestamp}] ${message}`);
};

const calculateStats = (data, field) => {
    const values = data.map(item => item[field]);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Standard deviation
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, median, min, max, stdDev };
};

// Data transformation
const transformRTPData = (results) => {
    return results.map(item => ({
        betAmount: item.wager,
        payout: item.win,
        rtp: (item.win / item.wager) * 100,
        gameId: item.gameId,
        timestamp: new Date(item.timestamp)
    }));
};

// Enhanced logging
const logError = (error, context) => {
    const timestamp = new Date().toISOString();
    const message = `[ERROR] [${timestamp}] ${context}: ${error.message}\n${error.stack}`;
    console.error(chalk.red(message));
    // Here you'd add your actual logging mechanism (file, database, etc.)
};

module.exports = {
    log,
    logError,
    calculateStats,
    transformRTPData
};