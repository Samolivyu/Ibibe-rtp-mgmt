//Meetup for API util scripts.
// api/scripts/index.js

const { log } = require('../src/utils'); // Assuming api/src/utils/index.js exists
const LoadTest = require('../src/load/load-test'); // Import the LoadTest class
const { LOAD_TEST_CONFIG } = require('../src/config/api-config');

/**
 * Main script runner for API utilities.
 */
async function runApiScript(scriptName, args = {}) {
    log(`Running API script: ${scriptName}`, 'info');
    try {
        switch (scriptName) {
            case 'run-load-test':
                log('Initiating API load test...', 'info');
                const loadTestManager = new LoadTest(LOAD_TEST_CONFIG);
                await loadTestManager.runFullTest();
                log('API load test completed.', 'success');
                break;
            case 'cleanup':
                log('Performing API specific cleanup...', 'info');
                // Add API specific cleanup logic here (e.g., clearing mock data, resetting test state)
                log('API cleanup completed.', 'success');
                break;
            // Add more cases for other API utility scripts
            default:
                log(`Unknown API script: ${scriptName}`, 'error');
                console.log('Available scripts: run-load-test, cleanup');
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
        runApiScript(scriptName);
    } else {
        log('Please provide a script name as an argument (e.g., node scripts/index.js run-load-test)', 'warn');
    }
}

module.exports = {
    runApiScript,
};