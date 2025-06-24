// src/core/results.anal.js
const math = require('mathjs');
const thresholds = require('../../config/test-thresholds');

module.exports = {
  analyzeResults(spinResults) {
    const validSpins = spinResults.filter(spin => !spin.error);
    const totalSpins = validSpins.length;
    const totalBet = totalSpins * 1; // Assuming 1 unit bet per spin
    const totalPayout = validSpins.reduce((sum, spin) => sum + spin.payout, 0);
    const rtp = totalPayout / totalBet;
    
    // Calculate confidence interval
    const variance = validSpins.reduce((sum, spin) => {
      return sum + Math.pow(spin.payout - rtp, 2);
    }, 0) / totalSpins;
    
    const stdDev = Math.sqrt(variance);
    const marginOfError = 1.96 * (stdDev / Math.sqrt(totalSpins)); // 95% CI
    const ciLower = rtp - marginOfError;
    const ciUpper = rtp + marginOfError;
    
    // Determine status
    let status = 'PASS';
    if (rtp < thresholds.rtp.warningThreshold) status = 'FAIL';
    else if (rtp < thresholds.rtp.accuracyThreshold) status = 'WARNING';
    
    return {
      totalSpins,
      totalBet,
      totalPayout,
      rtp,
      ciLower,
      ciUpper,
      status
    };
  }
};