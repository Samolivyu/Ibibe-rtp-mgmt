// src/server.js
require('./scripts/index'); // Start the server

// Keep process alive
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));