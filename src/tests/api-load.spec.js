// api/tests/api-load.spec.js

const { test, expect } = require('@playwright/test');
const LoadTest = require('../src/load/load-test'); // Corrected import
const { LOAD_TEST_CONFIG } = require('../src/config/api-config');
const { log } = require('../src/utils');

test.describe('API Load Tests', () => {
    test(`should handle ${LOAD_TEST_CONFIG.NUM_CONCURRENT_CLIENTS} concurrent clients for ${LOAD_TEST_CONFIG.DURATION_SECONDS} seconds`, async () => {
        log(`Running API Load Test: ${LOAD_TEST_CONFIG.NUM_CONCURRENT_CLIENTS} clients, ${LOAD_TEST_CONFIG.DURATION_SECONDS} seconds.`, 'info');

        const loadTestManager = new LoadTest(LOAD_TEST_CONFIG); // Use LoadTest class
        const report = await loadTestManager.runFullTest();

        log('\n--- API Load Test Summary ---');
        log(`Number of Clients: ${report.numClients}`);
        log(`Duration: ${report.durationSeconds} seconds`);
        log(`Total Requests: ${report.totalRequests}`);
        log(`Successful Requests: ${report.successfulRequests}`);
        log(`Failed Requests: ${report.failedRequests}`);
        log(`Error Rate: ${report.errorRate}`);
        log(`Average Latency: ${report.avgLatencyMs} ms`);
        log(`Throughput: ${report.throughputReqPerSec} req/sec`);
        log('--- End of Load Test Report ---');

        expect(report.successfulRequests).toBeGreaterThan(0);
        expect(parseFloat(report.errorRate)).toBeLessThanOrEqual(5.0);
        expect(parseFloat(report.avgLatencyMs)).toBeLessThan(1000);
        expect(parseFloat(report.throughputReqPerSec)).toBeGreaterThanOrEqual(1);
    });
});