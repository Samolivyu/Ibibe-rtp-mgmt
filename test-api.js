// test-api.js
require('dotenv').config();
const axios = require('axios');
const config = require('./config/domains');

async function testEndpoint(company) {
  const { baseUrl, gameListEndpoint, headers } = config[company];
  const url = `${baseUrl}${gameListEndpoint}`;
  
  console.log(`Testing ${company} endpoint: ${url}`);
  
  try {
    const response = await axios.get(url, {
      headers,
      timeout: 5000,
      validateStatus: () => true // Don't throw on non-200 status
    });
    
    console.log(`Status: ${response.status}`);
    console.log('Headers:', response.headers);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Test both endpoints
testEndpoint('playtest')
  .then(() => testEndpoint('casinoclient'))
  .catch(console.error);