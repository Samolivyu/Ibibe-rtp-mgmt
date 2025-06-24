const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(path.join(logDir, 'rtp-engine.log'), { flags: 'a' });

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  let output = `[${timestamp}] ${message}`;
  
  // Add color for console
  let consoleOutput = output;
  switch (type) {
    case 'success': consoleOutput = chalk.green(output); break;
    case 'warn': consoleOutput = chalk.yellow(output); break;
    case 'error': consoleOutput = chalk.red(output); break;
    case 'debug': consoleOutput = chalk.magenta(output); break;
    case 'info': consoleOutput = chalk.blue(output); break;
  }
  
  // Write to console and file
  console.log(consoleOutput);
  logStream.write(`${output}\n`);
};

const logError = (error, context) => {
  const message = `${context}: ${error.message}\n${error.stack}`;
  log(message, 'error');
};

module.exports = { log, logError };