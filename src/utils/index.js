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

module.exports = {
    log,
};