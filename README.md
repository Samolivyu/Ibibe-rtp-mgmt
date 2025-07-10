# RTP Monorepo merge

## Overview
This repository houses the core components of our gaming platform, designed as a monorepo for cohesive development and integrated testing. It includes:

- **API Service (`api/`)**: Backend service handling game requests, user authentication, and core game logic
- **RTP Engine (`rtp/`)**: Calculates, validates, and monitors Return to Player percentages
- **Validation System**: Integrated RTP validation and reporting tools

### Key Components
```
RTP-MERGE
├── api/                 # API Service
│   ├── config/          # Configuration files
│   │   ├── domains.js   # Client-specific API configurations
│   │   └── test-thresholds.js # Validation thresholds
│   ├── src/             # Core application logic
│   │   ├── core/
│   │   │   ├── rtp-orch.js      # RTP orchestration
│   │   │   ├── results-anal.js   # Results analysis
│   │   │   └── rtp-stats.js      # RTP statistics
│   │   ├── utils/          # Utility modules
│   │   └── app.js          # Main entry point
│   └── tests/             # API tests
├── rtp/                  # RTP Engine 
│   └── src/
│       ├── config/        # RTP configuration 
│       ├── core/          # Core RTP logic 
│       ├── data/          # Data handling 
│       └── scripts/       # Operational scripts 
├── reports/               # Generated reports 
├── test-results/          # Test outputs 
├── playwright.config.js    # Playwright configuration 
├── package.json           # Project dependencies and scripts 
└── .env                   # Environment variables 
```

### Component Interaction
- The API serves game requests and forwards `betAmount`, `payout`, `gameId`, and `clientId` data to the RTP Engine.
- The RTP Engine processes this data, performs statistical analysis, validates RTP against thresholds, and triggers alerts for deviations.

## Prerequisites & Setup

### System Requirements
- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+
- **RAM**: 4GB+ (8GB recommended for concurrent operations)

### Initial Setup
1. **Clone repository**:
    ```bash
    git clone https://your-repository-url.git
    cd rtp-merge
    ```
2. **Install dependencies**:
    ```bash
    npm install
    ```
3. **Configure environment**:
    Create `.env` files with required variables:
    ```bash
    # API configuration
    cp api/.env.example api/.env
    # RTP configuration
    cp rtp/.env.example rtp/.env
    ```

## Development Workflow

### Core Commands (package.json scripts)

| Command                      | Description                              |
|-----------------------------|------------------------------------------|
| `npm start`                 | Start API service (`node api/src/app.js`) |
| `npm test`                  | Run all API and RTP tests               |
| `npm run test:api`          | Run API tests                            |
| `npm run test:rtp`          | Run RTP tests                            |
| `npm run report`            | Generate validation reports               |
| `npm run analyze`           | Analyze test results                     |
| `npm run full-audit`        | Execute full RTP audit                   |

### Running Services
- Start the API service (primary entry point):
   ```bash
   npm start
   ```
- The RTP engine is triggered through:
  1. Test execution (`npm run test:rtp`)
  2. Direct script execution (e.g., `node rtp/src/scripts/rtp-index.js`)

### Testing Workflow
- Run complete test suite:
    ```bash
    npm test 
    # Equivalent to: 
    # npm run test:api && npm run test:rtp 
    ```
- Execute specific test types:
    ```bash
    # API tests only
    npm run test:api 
    # RTP validation tests
    npm run test:rtp 
    ```

### Report Generation
- Generate validation reports after testing:
    ```bash
    npm run report 
    ```
- Analyze test results:
    ```bash
    npm run analyze 
    ```

## Key Configuration Files
1. **`api/config/domains.js`** - API endpoints and client configurations
2. **`api/config/test-thresholds.js`** - RTP validation parameters
3. **`rtp/src/config/rtp-config.js`** - Game-specific RTP settings
4. **`playwright.config.js`** - Test runner configuration

