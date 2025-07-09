import fs from 'fs';
import path from 'path';
import { calculateStats } from '../utils/accuracy-calc.js';

export async function compileResults() {
  const reportsDir = path.join(process.cwd(), 'data', 'reports', 'json');
  const outputDir = path.join(process.cwd(), 'data', 'live-results');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const platformResults = {};
  
  // Process all JSON reports
  fs.readdirSync(reportsDir).forEach(file => {
    if (file.endsWith('.json')) {
      const data = JSON.parse(fs.readFileSync(path.join(reportsDir, file)));
      const platform = data.config?.projects[0]?.name || 'unknown';
      
      if (!platformResults[platform]) {
        platformResults[platform] = [];
      }
      
      data.suites.forEach(suite => {
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            const attachments = test.attachments.filter(a => a.name === 'rtp-results');
            if (attachments.length > 0) {
              const rtpData = JSON.parse(
                fs.readFileSync(path.join(reportsDir, attachments[0].path))
              );
              platformResults[platform].push(...rtpData);
            }
          });
        });
      });
    }
  });
  
  // Save platform-specific results
  Object.keys(platformResults).forEach(platform => {
    const filePath = path.join(outputDir, `${platform}-rtp-results.json`);
    fs.writeFileSync(filePath, JSON.stringify(platformResults[platform], null, 2));
  });
  
  // Generate comparison analysis
  if (Object.keys(platformResults).length > 1) {
    const comparison = comparePlatforms(platformResults);
    fs.writeFileSync(
      path.join(outputDir, 'comparison-analysis.json'),
      JSON.stringify(comparison, null, 2)
    );
  }
}

function comparePlatforms(platformResults) {
  const comparison = {};
  
  Object.keys(platformResults).forEach(platform => {
    comparison[platform] = {
      games: {},
      overall: calculateStats(platformResults[platform])
    };
    
    // Per-game statistics
    platformResults[platform].forEach(result => {
      if (!comparison[platform].games[result.gameId]) {
        comparison[platform].games[result.gameId] = {
          name: result.gameName,
          rtp: result.rtp,
          spins: result.spins.length,
          stats: calculateStats(result.spins)
        };
      }
    });
  });
  
  return comparison;
}