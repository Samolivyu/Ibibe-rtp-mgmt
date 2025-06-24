const { execSync } = require('child_process');

try {
  console.log('Discovering Playwright tests...');
  const output = execSync('npx playwright test --list', { encoding: 'utf-8' });
  
  if (output.includes('No tests found')) {
    console.error('❌ Error: No tests found!');
    console.log('Possible solutions:');
    console.log('1. Ensure test files end with .spec.js');
    console.log('2. Check testMatch pattern in playwright.config.js');
    console.log('3. Verify tests are in src/tests directory');
    process.exit(1);
  }
  
  console.log('✅ Tests discovered successfully:');
  console.log(output);
  process.exit(0);
} catch (error) {
  console.error('❌ Test discovery failed:', error.message);
  process.exit(1);
}