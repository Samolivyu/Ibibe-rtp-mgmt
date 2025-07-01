# RTP Component

## Objective
Build and maintain the Return to Player (RTP) calculation and validation system for gaming applications. This component focuses on mathematical accuracy, statistical analysis, and real-time monitoring of game payout percentages across multiple games and clients.

**Note:** This component directly relies on data provided by the API layer maintained by the API specialist.

## Tech Stack
- Node.js 
- JavaScript (ES6) 
- Playwright 
- Postman – for development-time testing of endpoints, supplying RTP data.

## Your Role & Responsibilities
As the RTP specialist, you're responsible for the mathematical engine that ensures fair play and regulatory compliance. Your work focuses on:
- **RTP Calculation Engine:** Core algorithms for computing theoretical and actual RTP values.
- **Statistical Analysis:** Variance tracking, confidence intervals, and deviation detection.
- **Data Collection:** Gathering game round data, bet amounts, and payout information.
- **Reporting Logic:** Creating mathematical models for RTP visualization and alerts.
- **Validation Rules:** Ensuring RTP values fall within acceptable regulatory ranges.

## Component Interaction
The API Component receives game requests and forwards round data (bets & payouts) to the RTP Component. The RTP Component validates RTP using this data and sends alerts if thresholds are breached.

📌 If API endpoints used by the RTP module are in development, Postman can mock, test, and validate them before full automation with Playwright is implemented.

## Project structure - RTP
```
rtp/
├── src/
│   ├── config/
│   │   └── rtp-config.js
│   ├── core/
│   │   ├── rtp-calc.js
│   │   └── rtp-stats.js
│   └── utils/
├── tests/
│   ├── rtp-valid.spec.js
│   └── rtp-performance.spec.js
├── scripts/
│   └── generate-sample-data.js
├── .env
├── package.json
└── README.md

```

## Shared Data Model
```json
{
  "betAmount": "number",
  "payout": "number",
  "gameId": "string",
  "clientId": "string"
}
````

## Workflow Structure

### Phase 1: Core RTP Framework (Week 1-2)

1.  **RTP Calculation Engine:** Core algorithms for computing RTP.
2.  **Statistical Analysis Tools:** Variance and confidence interval calculations.
3.  **Data Collection Mechanism:** Gathering game round data.
4.  **Reporting Logic:** Creating RTP reports and alerts.

### Phase 2: Testing Infrastructure (Week 3-4)

1.  **Validation Engine:** Schema and business rule validation.
2.  **Error Handling:** Comprehensive error detection and reporting.
3.  **Monitoring System:** RTP performance and health tracking.

### Phase 3: Integration & Scaling (Week 5-6)

1.  **API Integration:** Connect with API component for data exchange.
2.  **Reporting Integration:** RTP metrics and performance reports.
3.  **Scalability Testing:** Progressive load increase testing.
4.  **Documentation:** RTP specifications and integration guides.

## Deliverables

### Technical Deliverables

  - **RTP Calculation Engine:** Core algorithms for RTP computation.
  - **Statistical Analysis Tools:** Variance and confidence interval calculations.
  - **Data Collection Mechanism:** Gathering game round data.
  - **Reporting Logic:** Creating RTP reports and alerts.

### Documentation Deliverables

  - **RTP Specifications:** Complete calculation and validation documentation.
  - **Integration Guide:** Setup and configuration instructions.
  - **Test Coverage Report:** RTP test results and metrics.
  - **Performance Benchmarks:** RTP performance results and analysis.

## Coding Logic & Architecture

### Core RTP Calculation

```javascript
// Calculates actual RTP and validates it
class RTPCalculator {
  constructor(config) {
    this.targetRTP = config.targetRTP;
    this.tolerance = config.tolerance;
    this.minSampleSize = config.minSampleSize;
  }

  calculateActualRTP(gameData) {
    const totalBets = gameData.reduce((sum, round) => sum + round.betAmount, 0);
    const totalPayouts = gameData.reduce((sum, round) => sum + round.payout, 0);
    return (totalPayouts / totalBets) * 100;
  }

  validateRTP(actualRTP, targetRTP) {
    const deviation = Math.abs(actualRTP - targetRTP);
    return {
      isValid: deviation <= this.tolerance,
      deviation: deviation,
      confidence: this.calculateConfidence(actualRTP, targetRTP)
    };
  }
}
```

## Getting Started Quickly

### Install Dependencies:

```bash
npm install playwright @playwright/test dotenv
```

### Setup Environment:

```bash
npm install
npm run setup-rtp
```

### Run Initial Tests:

```bash
npm run test:rtp
npm run test:rtp-performance
```

### Run Setup Script:

```bash
npm run setup-rtp
```

### Generate Sample Data:

```bash
npm run generate-sample-data
```

### Start RTP Monitoring:

```bash
npm run start-rtp-monitor
```

# Postman Integration for RTP Development

While the API component primarily manages Postman collections, you can leverage Postman for:

1.  **Manual API Testing and Data Inspection**:

      * Use Postman to manually trigger API calls (e.g., placing bets, processing payouts) from the API component.
      * Inspect the raw JSON responses, which contain the `betAmount`, `payout`, `gameId`, and `clientId`.

2.  **Mocking API Endpoints**:

      * If the API endpoints are still under development, you can use Postman's mock server feature to simulate API responses. This allows you to test your RTP calculation logic with predefined data without relying on a fully functional API.

3.  **Exporting Data for RTP Analysis**:

      * Once you have successful API responses in Postman, you can manually copy or export this data to use as input for your RTP calculation functions, especially in the early development phases.

4.  **Validating RTP-Specific Endpoints**:

      * If the API component exposes an endpoint specifically for retrieving RTP data (e.g., `GET /rtpData`), you can use Postman to test and validate the responses from this endpoint. This helps ensure the API is correctly providing the aggregated RTP information.

5.  **Collaboration on Data Models**:

      * The shared data model (`betAmount`, `payout`, `gameId`, `clientId`) is crucial for both components. You can use Postman to define and validate API requests and responses against this shared model, ensuring consistency.

**Workflow Integration**:

  * **API Specialist's Role**: Your colleague (API specialist) will create and maintain Postman collections for API validation, including requests that generate `betAmount` and `payout` data.
  * **Your Role**: You can request these Postman collections or specific API response examples from your colleague. You can then use this data to:
      * Develop and debug your `RTPCalculator` and `RTPStatistics` modules using realistic data.
      * Manually feed response data into your RTP calculations during initial testing phases.
      * Work with the API specialist to ensure the data format and content from the API component are optimal for RTP calculations.

**Example: Feeding Postman Data to RTP Calculator (Conceptual)**

While Playwright handles the automated data flow, for quick manual checks during development, you can:

1.  Execute an API request in Postman (e.g., `POST Place Bet`).
2.  Get the `betId`, `amount`, and `payout` from the Postman response.
3.  Manually input this `betAmount` and `payout` into a test script within your RTP component or a temporary function to verify immediate RTP calculation results.

<!-- end list -->

```javascript
// src/rtp/temp-manual-test.js (For quick, isolated testing)
const RTPCalculator = require('../core/rtp-calc'); // Assuming this path

const rtpConfig = {
  targetRTP: 96.0,
  tolerance: 0.5,
  minSampleSize: 100
};

const rtpCalculator = new RTPCalculator(rtpConfig);

// Example data from a Postman API call response
const gameRoundDataFromPostman = [
  { betAmount: 10, payout: 9.5, gameId: "game-001", clientId: "client-001" },
  { betAmount: 5, payout: 4.8, gameId: "game-001", clientId: "client-001" },
  // ... more data
];

const actualRTP = rtpCalculator.calculateActualRTP(gameRoundDataFromPostman);
const validationResult = rtpCalculator.validateRTP(actualRTP, rtpConfig.targetRTP);

console.log(`Manual RTP Calculation: ${actualRTP.toFixed(2)}%`);
console.log(`Validation: ${validationResult.isValid ? 'Valid' : 'Invalid'}`);
console.log(`Deviation: ${validationResult.deviation.toFixed(2)}%`);
```
