// api/src/core/rtp-orch.js
import { getGames, executeSpinBatch, getUserRTP, loginUser } from '../utils/api-client.js';
import RTPCalculator from '../../../rtp/src/core/rtp-calc.js';
import config from '../../config/domains.js';
import thresholds from '../../config/test-thresholds.js';
import { log, logError } from '../utils/logger.js';

export async function runValidation() {
  const companies = Object.keys(config);
  const results = [];
  const userSessions = {};

  // 1. Authenticate real users first
  for (const company of companies) {
    try {
      const username = process.env[`${company.toUpperCase()}_USERNAME`];
      const password = process.env[`${company.toUpperCase()}_PASSWORD`];
      
      if (!username || !password) {
        throw new Error(`Missing credentials for ${company}`);
      }
      
      const session = await loginUser(company, username, password);
      userSessions[company] = session;
      log(`Authenticated ${company} user: ${session.userId}`, 'success');
    } catch (error) {
      logError(`Login failed for ${company}: ${error.message}`);
    }
  }

  // 2. Process validation with authenticated users
  for (const company of companies) {
    if (!userSessions[company]) {
      logError(`Skipping ${company} - no active session`, 'auth');
      continue;
    }
    
    const userId = userSessions[company].userId;
    log(`Starting validation for ${company} with user ${userId}`, 'info');

    try {
      const games = await getGames(company);
      if (!games.length) {
        log(`No games found for ${company}`, 'warn');
        continue;
      }

      for (const game of games) {
        const gameId = game?.id || game?.game_id || 'unknown';
        const gameName = game?.name || game?.title || 'Unnamed Game';
        const startTime = Date.now();

        try {
          // Execute spins for the game
          const spinResults = await executeGameTest(company, game);
          if (!spinResults.length) {
            throw new Error('No spins returned');
          }

          // Calculate actual RTP
          const actualRTPPercent = RTPCalculator.calculateRTP(spinResults);
          
          // Get expected RTP for this specific game/user
          const expectedData = await getUserRTP(company, userId, gameId);
          const expectedRTP = parseFloat(expectedData?.rtp);
          
          if (isNaN(actualRTPPercent) || isNaN(expectedRTP)) {
            throw new Error(`Invalid RTP values: actual=${actualRTPPercent}, expected=${expectedRTP}`);
          }

          const deviation = Math.abs(actualRTPPercent - expectedRTP);
          const withinRange = deviation <= thresholds.rtp.tolerance;

          results.push({
            company,
            gameId,
            gameName,
            userId,
            actualRTP: Number(actualRTPPercent.toFixed(2)),
            expectedRTP,
            deviation: Number(deviation.toFixed(2)),
            status: withinRange ? 'PASS' : 'FAIL',
            spins: spinResults.length,
            duration: Date.now() - startTime
          });

          log(
            `✓ ${gameName} → Actual: ${actualRTPPercent.toFixed(2)}% | Expected: ${expectedRTP}% → ${withinRange ? 'PASS' : 'FAIL'}`,
            withinRange ? 'success' : 'warn'
          );
        } catch (error) {
          logError(`Game ${gameName} failed: ${error.message}`);
          results.push({
            company,
            gameId,
            gameName,
            userId,
            status: 'ERROR',
            error: error.message
          });
        }
      }
    } catch (error) {
      logError(`Company processing failed for ${company}: ${error.message}`);
    }
  }

  return results;
}
export async function executeGameTest(company, game) {
  const batches = [];
  const batchSize = thresholds.rtp.batchSize;
  const totalSpins = thresholds.rtp.spinsPerGame;
  // Build spin batches
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
      executeSpinBatch(batch)
        .then(data => {
          if (Array.isArray(data)) {
            results.push(...data);
          } else {
            log(`Unexpected batch response for game ${batch.gameId}`, 'warn');
          }
          return data;
        })
        .catch(err => {
          log(`Batch failed for game ${batch.gameId}: ${err.message}`, 'error');
          return null;
        })
    );

    const responses = await Promise.all(promises);
    responses.forEach((res, idx) => {
      if (!res) {
        log(`❌ Batch ${idx + 1}/${current.length} failed for ${game.id}`, 'error');
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