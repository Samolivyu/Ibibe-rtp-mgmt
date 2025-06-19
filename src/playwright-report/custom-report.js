const fs = require('fs');
const path = require('path');
const { log } = require('../utils');
// custom-report.js
// @ts-check

/**
 * @implements {import('@playwright/test/reporter').Reporter}
 */
class RTPReporter {
    constructor(options) {
        this.rtpResults = [];
        this.options = options;
    }

    onBegin(config, suite) {
        this.outputDir = config.outputDir || path.join(process.cwd(), 'playwright-report');
        this.templatePath = path.join(__dirname, 'test-templates', 'rtp-report.html');
        console.log(`RTP Reporter initialized. Output: ${this.outputDir}`);
    }

    onTestEnd(test, result) {
        if (test.title.includes('RTP') || test.title.includes('simulation')) {
            const rtpData = result.attachments.find(a => a.name === 'rtp-data');
            if (rtpData && rtpData.body) {
                this.rtpResults.push(JSON.parse(rtpData.body.toString()));
            }
        }
    }

    async onEnd(result) {
        if (this.rtpResults.length === 0) return;
        
        const reportFile = path.join(this.outputDir, 'rtp-report.html');
        const template = fs.readFileSync(this.templatePath, 'utf8');
        
        const filledTemplate = template
            .replace('/* INSERT_RESULTS */', `const rtpResults = ${JSON.stringify(this.rtpResults)};`)
            .replace('{{GENERATION_DATE}}', new Date().toISOString());
        
        fs.writeFileSync(reportFile, filledTemplate);
        console.log(`RTP report generated: ${reportFile}`);
    }
}

module.exports = RTPReporter;