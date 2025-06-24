// src/app.js
require('dotenv').config();
const { runValidation } = require('./core/rtp-orch');
const { generateReport } = require('./reports/custom-report');
const { log } = require('./utils/logger');
const { verifyDomain } = require('./utils/dns-verify');
const config = require('../config/domains');

async function main() {
  try {
    log('Starting RTP Validation Engine', 'info');
    
    // Verify DNS for all domains
    for (const company of Object.keys(config)) {
      const domain = new URL(config[company].baseUrl).hostname;
      log(`Verifying DNS for ${domain}`, 'info');
      await verifyDomain(domain);
    }
    
    // Run core validation
    const validationResults = await runValidation();
    
    // Generate consolidated report
    await generateReport(validationResults);
    
    log('Validation completed successfully', 'success');
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Handle different execution modes
if (require.main === module) {
  main();
} else {
  module.exports = { main };
}