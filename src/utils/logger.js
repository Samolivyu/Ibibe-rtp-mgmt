import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const logDir = path.join(new URL('.', import.meta.url).pathname, '../../logs');
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

// Export the log and logError functions
export { log, logError };
