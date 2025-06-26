// playwright.global-teardown.js
import fs from 'fs';
import path from 'path';

const STORAGE_STATE_PATH = path.join(process.cwd(), 'playwright-auth-state.json');

async function globalTeardown() {
  console.log('Global teardown: Cleaning up authentication state...');
  if (fs.existsSync(STORAGE_STATE_PATH)) {
    fs.unlinkSync(STORAGE_STATE_PATH);
    console.log(`Authentication state file deleted: ${STORAGE_STATE_PATH}`);
  }
}

export default globalTeardown;
