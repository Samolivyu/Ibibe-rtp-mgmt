// minimal-reporter.js
const { Reporter } = require('@playwright/test/reporter');

class MinimalReporter extends Reporter {
    onBegin() {
        console.log('Tests started');
    }
    
    onEnd() {
        console.log('Tests finished');
    }
}

module.exports = MinimalReporter;