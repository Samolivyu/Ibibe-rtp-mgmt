import 'dotenv/config';
import { runValidation } from './core/rtp-orch.js';
import CustomReporter from './reports/custom-report.js';
import { verifyDomain } from './utils/dns-verify.js';
import config from '../config/domains.js';

// Import the new logger
import { log } from './utils/logger.js';

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
    await CustomReporter(validationResults);
    
    log('Validation completed successfully', 'success');
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

main();