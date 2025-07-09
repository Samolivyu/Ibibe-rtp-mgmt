import fs from 'fs';
import path from 'path';
import { compileResults } from './src/reports/';

async function globalTeardown(config) {
  console.log('Running global teardown');
  
  // Cleanup auth state files
  Object.keys(config.projects).forEach(companyKey => {
    const stateFile = `playwright-auth-state-${companyKey}.json`;
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }
  });
  
  // Compile and analyze RTP results
  await compileResults();
  
  console.log('Teardown complete');
}

export default globalTeardown;