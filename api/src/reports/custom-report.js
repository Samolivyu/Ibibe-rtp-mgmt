import { log } from '../utils/logger.js';

export default async function generateRTPReport(validationResults) {
  log('\n=== Consolidated RTP Validation Report ===', 'info');

  const stats = {
    totalGames: 0,
    passed: 0,
    failed: 0,
    totalSpins: 0,
    totalDuration: 0,
    gameDetails: []
  };

  for (const result of validationResults) {
    stats.totalGames++;
    stats.totalSpins += result.spins || 0;
    stats.totalDuration += result.duration || 0;

    if (result.status === 'PASS') stats.passed++;
    else stats.failed++;

    stats.gameDetails.push({
      name: result.gameName,
      id: result.gameId,
      actual: result.actualRTP + '%',
      expected: result.expectedRTP + '%',
      deviation: result.deviation + '%',
      spins: result.spins,
      duration: (result.duration / 1000).toFixed(2) + 's',
      status: result.status
    });
  }

  log(`\nTested Games: ${stats.totalGames}`, 'info');
  log(`Passed: ${stats.passed}`, 'success');
  log(`Failed: ${stats.failed}`, stats.failed > 0 ? 'error' : 'info');
  log(`Total Spins: ${stats.totalSpins}`, 'info');
  log(`Total Duration: ${(stats.totalDuration / 1000).toFixed(2)}s`, 'info');

  log(`\nDetailed Breakdown:`, 'info');
  stats.gameDetails.forEach(game => {
    const level = game.status === 'PASS' ? 'success' : 'error';
    log(` - ${game.name} (${game.id}): ${game.status} | Actual: ${game.actual} | Expected: ${game.expected} | Deviation: ${game.deviation} | Spins: ${game.spins} | Duration: ${game.duration}`, level);
  });

  log('\nReport generation completed.', 'info');
}
