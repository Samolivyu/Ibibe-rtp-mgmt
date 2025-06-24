const fs = require('fs');
const path = require('path');
const { log, logError } = require('../utils/logger');

class CustomReporter {
  onBegin(config, suite) {
    log('Starting RTP validation test suite', 'info');
    log(`Running ${suite.allTests().length} tests`, 'info');
  }

  onTestBegin(test, result) {
    log(`Starting test: ${test.title}`, 'debug');
  }

  onTestEnd(test, result) {
    const status = result.status;
    const duration = result.duration;
    
    if (status === 'passed') {
      log(`✓ ${test.title} (${duration}ms)`, 'success');
    } else if (status === 'failed') {
      log(`✗ ${test.title} (${duration}ms)`, 'error');
      if (result.error) {
        logError(result.error, `Test failure: ${test.title}`);
      }
    } else if (status === 'skipped') {
      log(`- ${test.title} (skipped)`, 'warn');
    }
  }

  onEnd(result) {
    const { status, startTime, duration } = result;
    const totalTests = result.allTests().length;
    const passed = result.allTests().filter(t => t.outcome() === 'expected').length;
    const failed = result.allTests().filter(t => t.outcome() === 'unexpected').length;
    const skipped = result.allTests().filter(t => t.outcome() === 'skipped').length;

    log('\n=== Test Summary ===', 'info');
    log(`Total: ${totalTests}`, 'info');
    log(`Passed: ${passed}`, 'success');
    log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    log(`Skipped: ${skipped}`, skipped > 0 ? 'warn' : 'info');
    log(`Duration: ${duration}ms`, 'info');
    log(`Status: ${status}`, status === 'passed' ? 'success' : 'error');
  }
}

module.exports = CustomReporter;