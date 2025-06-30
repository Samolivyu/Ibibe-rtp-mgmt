import yaml from 'js-yaml';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import thresholds from '../../config/test-thresholds.js';
import { log, logError } from './logger.js';

const SWAGGER_FILE_MAP = {
  playtest: 'dev.yaml',
  casinoclient: 'test.yaml'
};

export async function loadSwaggerSpec(company) {
  try {
    // Use environment variable if available
    const envVar = `SWAGGER_URL_${company.toUpperCase()}`;
    const swaggerUrl = process.env[envVar];
    
    if (swaggerUrl) {
      log(`Loading Swagger spec from URL: ${swaggerUrl}`, 'info');
      const response = await axios.get(swaggerUrl);
      return response.data;
    }
    
    // Fallback to local file
    const fileName = SWAGGER_FILE_MAP[company];
    if (!fileName) {
      throw new Error(`No Swagger file mapping for company: ${company}`);
    }
    
    const localPath = path.join(__dirname, '../../swagger', fileName);
    if (!fs.existsSync(localPath)) {
      throw new Error(`Swagger file not found: ${localPath}`);
    }
    
    log(`Loading Swagger spec from file: ${fileName}`, 'info');
    return yaml.load(fs.readFileSync(localPath, 'utf8'));
  } catch (error) {
    logError(error, `loadSwaggerSpec for ${company}`);
    throw new Error(`Failed to load Swagger spec for ${company}: ${error.message}`);
  }
}

export async function validateSwagger(company, gameId, calculatedRTP) {
  try {
    const swagger = await loadSwaggerSpec(company);
    const endpointPath = thresholds.swagger.endpoints[company].expectedRtp
      .replace('{gameId}', gameId);
    
    const expectedRTP = findExpectedRTP(swagger, endpointPath);
    if (expectedRTP === undefined) {
      log(`Expected RTP not found for ${gameId} in Swagger`, 'warn');
      return false;
    }
    
    const difference = Math.abs(calculatedRTP - expectedRTP);
    const isValid = difference <= (1 - thresholds.rtp.accuracyThreshold);
    
    log(`Swagger validation for ${gameId}: ${isValid ? 'PASS' : 'FAIL'} ` +
        `(Expected: ${expectedRTP}, Actual: ${calculatedRTP.toFixed(4)})`, 
        isValid ? 'success' : 'error');
        
    return isValid;
  } catch (error) {
    logError(error, 'Swagger validation');
    return false;
  }
}

export function findExpectedRTP(swagger, path) {
  // Improved traversal for nested Swagger structures
  const traverse = (obj) => {
    if (obj && typeof obj === 'object') {
      if (obj.example && obj.example.rtp) return obj.example.rtp;
      if (obj['x-rtp']) return obj['x-rtp'];
      
      for (const key in obj) {
        const result = traverse(obj[key]);
        if (result !== undefined) return result;
      }
    }
    return undefined;
  };
  
  const endpoint = swagger.paths[path]?.get?.responses?.['200']?.content?.['application/json']?.schema;
  return traverse(endpoint);
}
