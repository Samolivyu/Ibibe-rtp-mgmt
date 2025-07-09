import { getGames, executeSpinBatch, getUserRTP } from '../utils/api-client.js';
import RTPCalculator from '../../../rtp/src/core/rtp-calc.js';
import config from '../../config/domains.js';
import thresholds from '../../config/test-thresholds.js';
import { log } from '../utils/logger.js';

export async function runValidation() {
  const companies = Object.keys(config);
  const results = [];

  for (const company of companies) {
    log(`Starting validation for ${company}`, 'info');
    const games = await getGames(company);

    if (!Array.isArray(games) || games.length === 0) {
      log(`No games found for ${company}`, 'warn');
      continue;
    }

    for (const game of games) {
    const gameId = game?.id || game?.game_id || game?.gameId;
    const gameName = game?.name || game?.title || game?.game_title;

      if (!gameId || !gameName) {
        log(`Skipping game: missing id or name. Raw: ${JSON.stringify(game)}`, 'warn');
        continue;
      }

      const startTime = Date.now();
      try {
        const spinResults = await executeGameTest(company, game);
        if (!Array.isArray(spinResults) || spinResults.length === 0) {
          log(`No spins returned for ${gameName}`, 'warn');
          continue;
        }

        // In rtp-orch.js before RTP calculation:
        console.log("Spin Results Sample:", spinResults.slice(0, 2));
        console.log("Expected RTP Data:", expectedData);

        if (!expectedData || typeof expectedData.rtp === 'undefined') {
  throw new Error(`Invalid RTP response for ${gameName}`);
}

        // calculateRTP returns a percentage already
        const actualRTPPercent = RTPCalculator.calculateRTP(spinResults);
        const expectedData = await getUserRTP(company, 'test-user');
        const expectedRTP = parseFloat(expectedData?.rtp);

        if (isNaN(actualRTPPercent) || isNaN(expectedRTP)) {
          log(`Skipping ${gameName}: actual or expected RTP is NaN`, 'warn');
          continue;
        }

        const deviation = Math.abs(actualRTPPercent - expectedRTP);
        const withinRange = deviation <= thresholds.rtp.tolerance;

        const result = {
          company,
          gameId,
          gameName,
          actualRTP: Number(actualRTPPercent.toFixed(2)),
          expectedRTP,
          deviation: Number(deviation.toFixed(2)),
          status: withinRange ? 'PASS' : 'FAIL',
          spins: spinResults.length,
          duration: Date.now() - startTime
        };

        log(
          `✓ ${gameName} → Actual: ${result.actualRTP}% | Expected: ${expectedRTP}% → ${result.status}`,
          withinRange ? 'success' : 'warn'
        );
        results.push(result);
      } catch (error) {
        log(`Error validating ${gameName}: ${error.message}`, 'error');
      }
    }
  }

  return results;
}

export async function executeGameTest(company, game) {
  const batches = [];
  const batchSize = thresholds.rtp.batchSize;
  const totalSpins = thresholds.rtp.spinsPerGame;

  // build spin batches
  for (let i = 0; i < totalSpins; i += batchSize) {
    batches.push({
      company,
      gameId: game.id,
      spins: Math.min(batchSize, totalSpins - i),
      clientId: 'rtp-validation-player',
      betAmount: 1
    });
  }

  const concurrency = thresholds.execution.maxConcurrentGames;
  const results = [];

  while (batches.length) {
    const current = batches.splice(0, concurrency);
    const promises = current.map(batch =>
      executeSpinBatch(batch).catch(err => {
        log(`Batch failed for game ${batch.gameId}: ${err.message}`, 'error');
        return null;
      })
    );

    const responses = await Promise.all(promises);
responses.forEach((res, index) => {
  if (!res) {
    log(`❌ Batch ${index+1}/${batches.length} failed for ${game.id}`, 'error');
  }
});
  }

  if (results.length === 0) {
    log(
      `❌ No valid spin results collected for game ${game.name || 'unknown'} (${game.id})`,
      'error'
    );
  } else {
    log(
      `✅ Generated ${results.length} valid spins for game ${game.name || 'unnamed'} (${game.id})`,
      'info'
    );
  }

  return results;
}