import * as dns from 'dns/promises';
import { log, logError } from './logger.js';

export async function verifyDomain(hostname) {
  const context = 'dns-verify';
  try {
    const start = Date.now();
    const addresses = await Promise.race([
      dns.resolve4(hostname),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DNS timeout')), 5000)
      )
    ]);

    // Ensure we got at least one address
    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error(`No A records found for ${hostname}`);
    }

    const duration = Date.now() - start;
    log(`DNS resolved ${hostname} to ${addresses[0]} in ${duration}ms`, 'debug');
    return addresses[0];
  } catch (error) {
    // Properly pass the Error object and context
    logError(error, context);
    throw error;
  }
}