import { chromium } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';
import domainsConfig from './config/domains.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function globalSetup() {
  console.log('Starting multi-platform authentication');
  const authResults = {};

  for (const companyKey of Object.keys(domainsConfig)) {
    const company = domainsConfig[companyKey];
    const STORAGE_STATE_PATH = `playwright-auth-state-${companyKey}.json`;
    authResults[companyKey] = { success: false };
    
    console.log(`Authenticating for ${companyKey} at ${company.loginUrl}`);
    
    const browser = await chromium.launch({ headless: !process.env.DEBUG });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Navigate to login page
      await page.goto(company.loginUrl, { waitUntil: 'networkidle', timeout: 60000 });
      
      // Platform-specific login logic
      if (companyKey === 'playtest') {
        await page.click('button:has-text("Login")');
        await page.fill('input[name="username"]', company.username);
        await page.fill('input[name="password"]', company.password);
        await page.click('input[type="submit"]');
      } 
      else if (companyKey === 'casinoclient') {
        await page.click('button:has-text("Sign In")');
        await page.fill('input[name="email"]', company.username);
        await page.fill('input[name="password"]', company.password);
        await page.click('button[type="submit"]');
      }
      
      // Wait for successful login
      await page.waitForURL(url => url.toString().includes('dashboard'), { timeout: 30000 });
      console.log(`Authentication successful for ${companyKey}`);
      
      // Save authentication state
      await context.storageState({ path: STORAGE_STATE_PATH });
      authResults[companyKey].success = true;
    } catch (error) {
      console.error(`Authentication failed for ${companyKey}: ${error.message}`);
      authResults[companyKey].error = error.message;
    } finally {
      await browser.close();
    }
  }
  
  // Save authentication results for reporting
  require('fs').writeFileSync('auth-results.json', JSON.stringify(authResults));
  return authResults;
}

export default globalSetup;