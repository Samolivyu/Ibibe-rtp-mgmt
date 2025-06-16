// rtp/scripts/index.js

const { log } = require('../src/utils'); // Assuming rtp/src/utils/index.js exists
const generateSampleData = require('./generate-sample-data'); // Ensure this file exists and exports a function

/**
 * Main script runner for RTP utilities.
 */
async function runRtpScript(scriptName, args = {}) {
    log(`Running RTP script: ${scriptName}`, 'info');
    try {
        switch (scriptName) {
            case 'generate-sample-data':
                await generateSampleData.run();
                log('Sample data generation completed.', 'success');
                break;
            case 'cleanup':
                log('Performing RTP specific cleanup...', 'info');
                // Add RTP specific cleanup logic here (e.g., clearing data files)
                log('RTP cleanup completed.', 'success');
                break;
            // Add more cases for other RTP utility scripts
            default:
                log(`Unknown RTP script: ${scriptName}`, 'error');
                console.log('Available scripts: generate-sample-data, cleanup');
        }
    } catch (error) {
        log(`Error running script ${scriptName}: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Allow running specific scripts via command line
if (require.main === module) {
    const scriptName = process.argv[2];
    if (scriptName) {
        runRtpScript(scriptName);
    } else {
        log('Please provide a script name as an argument (e.g., node scripts/index.js generate-sample-data)', 'warn');
    }
}

module.exports = {
    runRtpScript,
    // You might also export specific utility functions here if they are reusable
    generateSampleData,
};