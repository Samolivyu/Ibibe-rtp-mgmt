// src/services/results-analyzer.js
const { calculateStats, transformRTPData } = require('../utils');
const { log } = require('../utils');
const { VALIDATION_THRESHOLDS } = require('../config/api-config');

class ResultsAnalyzer {
    analyze(rawResults) {
        // Transform and validate data
        const results = transformRTPData(rawResults);
        if (results.length === 0) throw new Error('No results to analyze');
        
        // Calculate RTP
        const totalBet = results.reduce((sum, r) => sum + r.betAmount, 0);
        const totalPayout = results.reduce((sum, r) => sum + r.payout, 0);
        const calculatedRTP = (totalPayout / totalBet) * 100;
        
        // Statistical analysis
        const rtpStats = calculateStats(results, 'rtp');
        const betStats = calculateStats(results, 'betAmount');
        const payoutStats = calculateStats(results, 'payout');
        
        // Generate report
        const report = {
            gameId: results[0].gameId,
            totalSpins: results.length,
            calculatedRTP: parseFloat(calculatedRTP.toFixed(2)),
            expectedRTP: null, // Will be set by orchestrator
            variance: null,
            betStats,
            payoutStats,
            rtpStats,
            isCompliant: true,
            anomalies: []
        };
        
        // Identify anomalies
        results.forEach(result => {
            if (result.rtp < VALIDATION_THRESHOLDS.RTP_MIN || 
                result.rtp > VALIDATION_THRESHOLDS.RTP_MAX) {
                report.anomalies.push(result);
            }
        });
        
        log(`RTP Analysis Complete: ${report.calculatedRTP}% over ${report.totalSpins} spins`);
        return report;
    }
    
    generateReport(reportData, format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(reportData, null, 2);
            case 'html':
                // Simplified - would use a template in real implementation
                return `
                    <h1>RTP Validation Report</h1>
                    <p>Game ID: ${reportData.gameId}</p>
                    <p>Calculated RTP: ${reportData.calculatedRTP}%</p>
                    <p>Total Spins: ${reportData.totalSpins}</p>
                `;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }
}

module.exports = ResultsAnalyzer;