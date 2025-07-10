import 'dotenv/config';
import { log, logError } from './utils/logger.js';
import config from '../config/domains.js';
import RTPSimulator from './rtp-sim.js'; // Import the new simulator
import generateRTPReport from './reports/custom-report.js'; // Your custom report generator

async function main() {
  try {
    log('Application starting...', 'info');

    // Debug: Log configuration
    console.log('PlayTest API URL:', config.playtest.apiBaseUrl);
    console.log('Casino Client API URL:', config.casinoclient.apiBaseUrl);

    const simulator = new RTPSimulator();
    const results = await simulator.run(); // Run the full simulation

    await generateRTPReport(results); // Generate the report from simulation results

    log('Application completed successfully.', 'success');
    process.exit(0);
  } catch (error) {
    logError(`Fatal error: ${error.message}`, 'main');
    process.exit(1);
  }
}

main();