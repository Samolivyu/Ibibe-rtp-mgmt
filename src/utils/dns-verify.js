import dns from 'dns';
import { log } from './logger.js';

export async function verifyDomain(domain) {
  return new Promise((resolve, reject) => {
    dns.lookup(domain, (err, address) => {
      if (err) {
        log(`DNS resolution failed for ${domain}: ${err.message}`, 'error');
        log('Please check your network configuration or /etc/hosts file', 'warn');
        reject(err);
      } else {
        log(`DNS resolved ${domain} to ${address}`, 'success');
        resolve();
      }
    });
  });
}