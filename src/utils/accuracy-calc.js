import { mean, variance, std, min, max } from 'mathjs';

export function calculateRTP(spinResults) {
  const totalBet = spinResults.length;
  const totalPayout = spinResults.reduce((sum, spin) => sum + spin.payout, 0);
  return totalPayout / totalBet;
}

export function calculateStats(spinResults) {
  const payouts = spinResults.map(spin => spin.payout);
  const mean = math.mean(payouts);
  const variance = math.variance(payouts);
  const stdDev = math.std(payouts);
  
  // Sort for median and percentiles
  const sorted = [...payouts].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  return {
    mean,
    median,
    variance,
    stdDev,
    min: math.min(payouts),
    max: math.max(payouts)
  };
}
