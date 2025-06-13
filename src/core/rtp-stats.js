/**
 * RTP Statistics Module
 * Advanced statistical analysis, confidence intervals, and trend analysis
 */

class RTPStatistics {
  constructor() {
    this.analysisResults = new Map();
  }

  /**
   * Perform comprehensive statistical analysis on RTP data
   * @param {Array} gameData - Array of game round data
   * @param {Object} config - Game configuration
   * @returns {Object} Statistical analysis results
   */
  performStatisticalAnalysis(gameData, config) {
    if (!gameData || gameData.length === 0) {
      return this.getEmptyAnalysis();
    }

    const rtpValues = this.calculateRTPPerRound(gameData);
    const analysis = {
      basicStats: this.calculateBasicStatistics(rtpValues),
      distribution: this.analyzeDistribution(rtpValues),
      trends: this.analyzeTrends(rtpValues),
      outliers: this.detectOutliers(rtpValues),
      confidenceInterval: this.calculateConfidenceInterval(rtpValues, config.confidenceLevel),
      volatility: this.calculateVolatility(rtpValues),
      streakAnalysis: this.analyzeStreaks(rtpValues, config.targetRTP)
    };

    return analysis;
  }

  /**
   * Calculate RTP for each individual round
   * @param {Array} gameData - Game round data
   * @returns {Array} RTP values per round
   */
  calculateRTPPerRound(gameData) {
    return gameData
      .filter(round => round.betAmount > 0)
      .map(round => (round.payout / round.betAmount) * 100);
  }

  /**
   * Calculate basic statistical measures
   * @param {Array} rtpValues - Array of RTP values
   * @returns {Object} Basic statistics
   */
  calculateBasicStatistics(rtpValues) {
    if (rtpValues.length === 0) return {};

    const sorted = [...rtpValues].sort((a, b) => a - b);
    const n = rtpValues.length;
    const sum = rtpValues.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    
    const variance = rtpValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
    const standardDeviation = Math.sqrt(variance);

    return {
      count: n,
      mean: Number(mean.toFixed(4)),
      median: this.calculateMedian(sorted),
      mode: this.calculateMode(rtpValues),
      variance: Number(variance.toFixed(4)),
      standardDeviation: Number(standardDeviation.toFixed(4)),
      min: Number(sorted[0].toFixed(4)),
      max: Number(sorted[n - 1].toFixed(4)),
      range: Number((sorted[n - 1] - sorted[0]).toFixed(4)),
      quartiles: this.calculateQuartiles(sorted)
    };
  }

  /**
   * Calculate median value
   * @param {Array} sortedValues - Sorted array of values
   * @returns {number} Median value
   */
  calculateMedian(sortedValues) {
    const n = sortedValues.length;
    if (n % 2 === 0) {
      return Number(((sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2).toFixed(4));
    } else {
      return Number(sortedValues[Math.floor(n / 2)].toFixed(4));
    }
  }

  /**
   * Calculate mode (most frequent value)
   * @param {Array} values - Array of values
   * @returns {number|null} Mode value or null if no mode
   */
  calculateMode(values) {
    const frequency = {};
    let maxFreq = 0;
    let mode = null;

    values.forEach(val => {
      const rounded = Math.round(val * 100) / 100; // Round to 2 decimals for grouping
      frequency[rounded] = (frequency[rounded] || 0) + 1;
      if (frequency[rounded] > maxFreq) {
        maxFreq = frequency[rounded];
        mode = rounded;
      }
    });

    return maxFreq > 1 ? mode : null;
  }

  /**
   * Calculate quartiles
   * @param {Array} sortedValues - Sorted array of values
   * @returns {Object} Quartile values
   */
  calculateQuartiles(sortedValues) {
    const n = sortedValues.length;
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);

    return {
      q1: Number(sortedValues[q1Index].toFixed(4)),
      q3: Number(sortedValues[q3Index].toFixed(4)),
      iqr: Number((sortedValues[q3Index] - sortedValues[q1Index]).toFixed(4))
    };
  }

  /**
   * Analyze RTP distribution
   * @param {Array} rtpValues - Array of RTP values
   * @returns {Object} Distribution analysis
   */
  analyzeDistribution(rtpValues) {
    const buckets = this.createHistogramBuckets(rtpValues, 20);
    const skewness = this.calculateSkewness(rtpValues);
    const kurtosis = this.calculateKurtosis(rtpValues);

    return {
      histogram: buckets,
      skewness: Number(skewness.toFixed(4)),
      kurtosis: Number(kurtosis.toFixed(4)),
      normalityTest: this.testNormality(rtpValues)
    };
  }

  /**
   * Create histogram buckets for distribution analysis
   * @param {Array} values - Array of values
   * @param {number} bucketCount - Number of buckets
   * @returns {Array} Histogram buckets
   */
  createHistogramBuckets(values, bucketCount = 20) {
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const bucketSize = (max - min) / bucketCount;
    const buckets = Array(bucketCount).fill(0).map((_, i) => ({
      min: min + (i * bucketSize),
      max: min + ((i + 1) * bucketSize),
      count: 0,
      percentage: 0
    }));

    values.forEach(value => {
      const bucketIndex = Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1);
      buckets[bucketIndex].count++;
    });

    buckets.forEach(bucket => {
      bucket.percentage = Number(((bucket.count / values.length) * 100).toFixed(2));
    });

    return buckets;
  }

  /**
   * Calculate skewness
   * @param {Array} values - Array of values
   * @returns {number} Skewness value
   */
  calculateSkewness(values) {
    const n = values.length;
    const mean = values.reduce((acc, val) => acc + val, 0) / n;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    const skew = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / n;
    return skew;
  }

  /**
   * Calculate kurtosis
   * @param {Array} values - Array of values
   * @returns {number} Kurtosis value
   */
  calculateKurtosis(values) {
    const n = values.length;
    const mean = values.reduce((acc, val) => acc + val, 0) / n;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    const kurt = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0) / n;
    return kurt - 3; // Excess kurtosis
  }

  /**
   * Test for normality (simplified Jarque-Bera test)
   * @param {Array} values - Array of values
   * @returns {Object} Normality test results
   */
  testNormality(values) {
    const n = values.length;
    const skewness = this.calculateSkewness(values);
    const kurtosis = this.calculateKurtosis(values);
    
    const jbStatistic = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosis, 2) / 4);
    const isNormal = jbStatistic < 5.99; // Critical value for 95% confidence

    return {
      jarqueBeraStatistic: Number(jbStatistic.toFixed(4)),
      isNormal: isNormal,
      pValue: this.approximatePValue(jbStatistic)
    };
  }

  /**
   * Approximate p-value for Jarque-Bera test
   * @param {number} jbStatistic - Jarque-Bera statistic
   * @returns {number} Approximate p-value
   */
  approximatePValue(jbStatistic) {
    // Simplified approximation
    if (jbStatistic < 2) return 0.8;
    if (jbStatistic < 4) return 0.5;
    if (jbStatistic < 6) return 0.2;
    if (jbStatistic < 10) return 0.05;
    return 0.01;
  }

  /**
   * Analyze trends in RTP data
   * @param {Array} rtpValues - Array of RTP values
   * @returns {Object} Trend analysis
   */
  analyzeTrends(rtpValues) {
    if (rtpValues.length < 10) {
      return { trend: 'insufficient_data', slope: 0, correlation: 0 };
    }

    const indices = Array.from({ length: rtpValues.length }, (_, i) => i);
    const { slope, correlation } = this.linearRegression(indices, rtpValues);
    
    let trend = 'stable';
    if (Math.abs(slope) > 0.01) {
      trend = slope > 0 ? 'increasing' : 'decreasing';
    }

    return {
      trend: trend,
      slope: Number(slope.toFixed(6)),
      correlation: Number(correlation.toFixed(4)),
      movingAverages: this.calculateMovingAverages(rtpValues)
    };
  }

  /**
   * Perform linear regression
   * @param {Array} x - X values
   * @param {Array} y - Y values
   * @returns {Object} Regression results
   */
  linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((acc, val) => acc + val, 0);
    const sumY = y.reduce((acc, val) => acc + val, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
    const sumXX = x.reduce((acc, val) => acc + val * val, 0);
    const sumYY = y.reduce((acc, val) => acc + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return { slope, correlation };
  }

  /**
   * Calculate moving averages
   * @param {Array} values - Array of values
   * @returns {Object} Moving averages
   */
  calculateMovingAverages(values) {
    const windows = [10, 50, 100];
    const movingAverages = {};

    windows.forEach(window => {
      if (values.length >= window) {
        const ma = [];
        for (let i = window - 1; i < values.length; i++) {
          const windowValues = values.slice(i - window + 1, i + 1);
          const average = windowValues.reduce((acc, val) => acc + val, 0) / window;
          ma.push(Number(average.toFixed(4)));
        }
        movingAverages[`ma${window}`] = ma;
      }
    });

    return movingAverages;
  }

  /**
   * Detect outliers using IQR method
   * @param {Array} values - Array of values
   * @returns {Object} Outlier analysis
   */
  detectOutliers(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = values.filter(val => val < lowerBound || val > upperBound);
    
    return {
      count: outliers.length,
      percentage: Number(((outliers.length / values.length) * 100).toFixed(2)),
      lowerBound: Number(lowerBound.toFixed(4)),
      upperBound: Number(upperBound.toFixed(4)),
      outlierValues: outliers.map(val => Number(val.toFixed(4)))
    };
  }

  /**
   * Calculate confidence interval
   * @param {Array} values - Array of values
   * @param {number} confidenceLevel - Confidence level (0-1)
   * @returns {Object} Confidence interval
   */
  calculateConfidenceInterval(values, confidenceLevel = 0.95) {
    if (values.length < 2) return { lower: 0, upper: 0, margin: 0 };

    const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1);
    const standardError = Math.sqrt(variance / values.length);
    
    // Approximate critical value for given confidence level
    const alpha = 1 - confidenceLevel;
    const criticalValue = this.getCriticalValue(alpha, values.length - 1);
    const margin = criticalValue * standardError;

    return {
      lower: Number((mean - margin).toFixed(4)),
      upper: Number((mean + margin).toFixed(4)),
      margin: Number(margin.toFixed(4)),
      confidenceLevel: confidenceLevel
    };
  }

  /**
   * Get critical value for t-distribution (approximation)
   * @param {number} alpha - Significance level
   * @param {number} df - Degrees of freedom
   * @returns {number} Critical value
   */
  getCriticalValue(alpha, df) {
    // Simplified approximation for common confidence levels
    if (alpha <= 0.01) return 2.576; // 99%
    if (alpha <= 0.05) return 1.96;  // 95%
    if (alpha <= 0.1) return 1.645;  // 90%
    return 1.96; // Default to 95%
  }

  /**
   * Calculate volatility measures
   * @param {Array} values - Array of values
   * @returns {Object} Volatility analysis
   */
  calculateVolatility(values) {
    if (values.length < 2) return { volatility: 0, annualizedVolatility: 0 };

    const returns = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] !== 0) {
        returns.push((values[i] - values[i - 1]) / values[i - 1]);
      }
    }

    if (returns.length === 0) return { volatility: 0, annualizedVolatility: 0 };

    const variance = returns.reduce((acc, ret) => {
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      return acc + Math.pow(ret - mean, 2);
    }, 0) / (returns.length - 1);

    const volatility = Math.sqrt(variance);
    const annualizedVolatility = volatility * Math.sqrt(252); // Assuming 252 trading days

    return {
      volatility: Number(volatility.toFixed(6)),
      annualizedVolatility: Number(annualizedVolatility.toFixed(6)),
      returnsCount: returns.length
    };
  }

  /**
   * Analyze winning and losing streaks
   * @param {Array} rtpValues - Array of RTP values
   * @param {number} targetRTP - Target RTP for comparison
   * @returns {Object} Streak analysis
   */
  analyzeStreaks(rtpValues, targetRTP) {
    if (rtpValues.length === 0) return this.getEmptyStreakAnalysis();

    const streaks = [];
    let currentStreak = { type: null, length: 0, startIndex: 0 };

    rtpValues.forEach((rtp, index) => {
      const isWinning = rtp >= targetRTP;
      const streakType = isWinning ? 'winning' : 'losing';

      if (currentStreak.type === null) {
        currentStreak = { type: streakType, length: 1, startIndex: index };
      } else if (currentStreak.type === streakType) {
        currentStreak.length++;
      } else {
        streaks.push({ ...currentStreak });
        currentStreak = { type: streakType, length: 1, startIndex: index };
      }
    });

    if (currentStreak.length > 0) {
      streaks.push(currentStreak);
    }

    const winningStreaks = streaks.filter(s => s.type === 'winning');
    const losingStreaks = streaks.filter(s => s.type === 'losing');

    return {
      totalStreaks: streaks.length,
      winningStreaks: {
        count: winningStreaks.length,
        maxLength: winningStreaks.length > 0 ? Math.max(...winningStreaks.map(s => s.length)) : 0,
        averageLength: winningStreaks.length > 0 ? 
          Number((winningStreaks.reduce((acc, s) => acc + s.length, 0) / winningStreaks.length).toFixed(2)) : 0
      },
      losingStreaks: {
        count: losingStreaks.length,
        maxLength: losingStreaks.length > 0 ? Math.max(...losingStreaks.map(s => s.length)) : 0,
        averageLength: losingStreaks.length > 0 ? 
          Number((losingStreaks.reduce((acc, s) => acc + s.length, 0) / losingStreaks.length).toFixed(2)) : 0
      },
      streakDetails: streaks.slice(-10) // Last 10 streaks for detailed analysis
    };
  }

  /**
   * Get empty analysis structure
   * @returns {Object} Empty analysis object
   */
  getEmptyAnalysis() {
    return {
      basicStats: {},
      distribution: { histogram: [], skewness: 0, kurtosis: 0, normalityTest: {} },
      trends: { trend: 'no_data', slope: 0, correlation: 0 },
      outliers: { count: 0, percentage: 0, outlierValues: [] },
      confidenceInterval: { lower: 0, upper: 0, margin: 0 },
      volatility: { volatility: 0, annualizedVolatility: 0 },
      streakAnalysis: this.getEmptyStreakAnalysis()
    };
  }

  /**
   * Get empty streak analysis structure
   * @returns {Object} Empty streak analysis object
   */
  getEmptyStreakAnalysis() {
    return {
      totalStreaks: 0,
      winningStreaks: { count: 0, maxLength: 0, averageLength: 0 },
      losingStreaks: { count: 0, maxLength: 0, averageLength: 0 },
      streakDetails: []
    };
  }

  /**
   * Generate statistical summary report
   * @param {Array} gameData - Game round data
   * @param {Object} config - Game configuration
   * @returns {Object} Summary report
   */
  generateSummaryReport(gameData, config) {
    const analysis = this.performStatisticalAnalysis(gameData, config);
    const rtpValues = this.calculateRTPPerRound(gameData);
    
    return {
      reportTimestamp: new Date().toISOString(),
      gameConfig: config,
      dataOverview: {
        totalRounds: gameData.length,
        validRounds: rtpValues.length,
        dataQuality: Number(((rtpValues.length / gameData.length) * 100).toFixed(2))
      },
      keyMetrics: {
        meanRTP: analysis.basicStats.mean,
        targetRTP: config.targetRTP,
        deviation: Math.abs(analysis.basicStats.mean - config.targetRTP),
        withinTolerance: Math.abs(analysis.basicStats.mean - config.targetRTP) <= config.tolerance,
        confidenceInterval: analysis.confidenceInterval,
        volatility: analysis.volatility.volatility
      },
      qualityIndicators: {
        normalDistribution: analysis.distribution.normalityTest.isNormal,
        outlierPercentage: analysis.outliers.percentage,
        longestLosingStreak: analysis.streakAnalysis.losingStreaks.maxLength,
        trendDirection: analysis.trends.trend
      },
      recommendations: this.generateRecommendations(analysis, config)
    };
  }

  /**
   * Generate recommendations based on analysis
   * @param {Object} analysis - Statistical analysis results
   * @param {Object} config - Game configuration
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(analysis, config) {
    const recommendations = [];

    // RTP deviation recommendations
    const deviation = Math.abs(analysis.basicStats.mean - config.targetRTP);
    if (deviation > config.tolerance) {
      recommendations.push({
        type: 'critical',
        category: 'rtp_deviation',
        message: `RTP deviation of ${deviation.toFixed(4)}% exceeds tolerance of ${config.tolerance}%`,
        action: 'Investigate game configuration and payout tables'
      });
    }

    // Volatility recommendations
    if (analysis.volatility.volatility > 0.5) {
      recommendations.push({
        type: 'warning',
        category: 'high_volatility',
        message: `High volatility detected (${analysis.volatility.volatility.toFixed(4)})`,
        action: 'Monitor for potential payout irregularities'
      });
    }

    // Outlier recommendations
    if (analysis.outliers.percentage > 10) {
      recommendations.push({
        type: 'warning',
        category: 'outliers',
        message: `${analysis.outliers.percentage}% of rounds are statistical outliers`,
        action: 'Review outlier rounds for potential issues'
      });
    }

    // Streak recommendations
    if (analysis.streakAnalysis.losingStreaks.maxLength > 100) {
      recommendations.push({
        type: 'warning',
        category: 'long_streaks',
        message: `Maximum losing streak of ${analysis.streakAnalysis.losingStreaks.maxLength} detected`,
        action: 'Verify game fairness and random number generation'
      });
    }

    // Trend recommendations
    if (analysis.trends.trend !== 'stable' && Math.abs(analysis.trends.correlation) > 0.3) {
      recommendations.push({
        type: 'info',
        category: 'trends',
        message: `${analysis.trends.trend} trend detected with correlation ${analysis.trends.correlation}`,
        action: 'Monitor trend continuation and investigate if persistent'
      });
    }

    return recommendations;
  }
}

module.exports = RTPStatistics;