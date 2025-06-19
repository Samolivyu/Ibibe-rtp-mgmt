// src/scripts/index.js
const { log } = require('../utils/index');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const RTPOrchestrator = require('../services/rtp-orchestrator');


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    version: process.env.npm_package_version
  });
});

// Export server instance instead of starting it
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server startup error:', error);
    process.exit(1);
});

async function runApiScript(scriptName, args = {}) {
    log(`Running API script: ${scriptName}`, 'info');
    try {
        switch (scriptName) {
            // ... existing cases ...
            case 'run-rtp-test':
                log('Starting RTP validation test...', 'info');
                const orchestrator = new RTPOrchestrator();
                await orchestrator.runFullTest(args.gameId);
                log('RTP test completed successfully', 'success');
                break;
            case 'run-simulation':
                log('Starting spin simulation...', 'info');
                const simulationId = await orchestrator.runSimulation(
                    args.gameId, 
                    args.spinCount || 5000
                );
                log(`Simulation started with ID: ${simulationId}`, 'success');
                break;
            default:
                // ... existing default ...
        }
    } catch (error) {
        logError(error, `runApiScript:${scriptName}`);
        process.exit(1);
    }
}

module.exports = server;