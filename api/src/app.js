import 'dotenv/config';
import { getGames, getUserRTP, loginUser } from './utils/api-client.js';
import generateRTPReport from './reports/custom-report.js';
import { verifyDomain } from './utils/dns-verify.js';
import config from '../config/domains.js';
import { log, logError } from './utils/logger.js';

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'unhandled');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`, 'uncaught');
  process.exit(1);
});

async function main() {
  try {
    log('Starting RTP Validation Engine', 'info');
    
    // 1. Validate critical configuration
    const requiredVars = [
      'PLAY_TEST_API_BASE_URL', 
      'CASINO_CLIENT_API_BASE_URL',
      'PLAY_TEST_USERNAME',
      'PLAY_TEST_PASSWORD',
      'CASINO_CLIENT_USERNAME',
      'CASINO_CLIENT_PASSWORD'
    ];
    
    const missingVars = requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    // 2. Verify API domains
    for (const company of Object.keys(config)) {
      const apiUrl = config[company].apiBaseUrl;
      if (!apiUrl) throw new Error(`Missing apiBaseUrl for ${company}`);
      
      const apiDomain = new URL(apiUrl).hostname;
      log(`Verifying DNS for API domain: ${apiDomain}`, 'info');
      await verifyDomain(apiDomain);
    }

    const results = [];
    const userSessions = {};

    // 3. Authenticate real users
    for (const company of Object.keys(config)) {
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

    // 4. Process games with authenticated users
    for (const company of Object.keys(config)) {
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
          
          try {
            // Get game-specific RTP for authenticated user
            const rtpData = await getUserRTP(company, userId, gameId);
            
            // Validate response structure
            if (!rtpData || typeof rtpData.rtp === 'undefined') {
              throw new Error('Invalid RTP response structure');
            }
            
            results.push({
              company,
              gameId,
              gameName,
              userId,
              rtp: parseFloat(rtpData.rtp),
              status: 'VALID'
            });
            
            log(`✓ ${gameName} RTP: ${rtpData.rtp}%`, 'success');
          } catch (error) {
            logError(`Game ${gameName} failed: ${error.message}`, 'rtp-fetch');
            results.push({
              company,
              gameId,
              gameName,
              userId,
              rtp: 0,
              status: 'ERROR',
              error: error.message
            });
          }
        }
      } catch (error) {
        logError(`Game processing failed for ${company}: ${error.message}`);
      }
    }

    // 5. Generate report
    if (results.length > 0) {
      await generateRTPReport(results);
      log(`Validation completed. Processed ${results.length} games`, 'success');
    } else {
      logError('No games processed. Validation failed', 'results');
    }
  } catch (error) {
    logError(`Fatal error: ${error.message}`, 'main');
    process.exit(1);
  }
}

main();