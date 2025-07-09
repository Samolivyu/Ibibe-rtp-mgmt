// api/src/app.js
import 'dotenv/config';
import { getGames, getUserRTP } from './utils/api-client.js';
import generateRTPReport from './reports/custom-report.js';
import { verifyDomain } from './utils/dns-verify.js';
import config from '../config/domains.js';
import { log, logError } from './utils/logger.js';

async function main() {
  try {
    log('Starting RTP Validation Engine', 'info');

    for (const company of Object.keys(config)) {
      const domain = new URL(config[company].gameBaseUrl).hostname;
      log(`Verifying DNS for ${domain}`, 'info');
      await verifyDomain(domain);
    }

    const results = [];

    for (const company of Object.keys(config)) {
      log(`Starting validation for ${company}`, 'info');

      const games = await getGames(company);

      if (!games.length) {
        log(`No games found for ${company}`, 'warn');
        continue;
      }

      for (const game of games) {
        const userId = game?.userId || 'test-user'; // adjust based on structure
        try {
          const rtpData = await getUserRTP(company, userId);
          results.push({
            company,
            gameTitle: game?.title || game?.game_title || 'Unknown',
            rtp: rtpData?.rtp || rtpData?.returnToPlayer || 'N/A',
          });
        } catch (error) {
          logError(error.message, `rtp-fetch:${company}`);
        }
      }
    }

    await generateRTPReport(results);
    log('Validation completed successfully', 'success');
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

main();
