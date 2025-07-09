# Gaming Platform Monorepo

## Overview

This repository houses the core components of our gaming platform, designed as a monorepo for cohesive development and integrated testing. It includes:

* **Gaming API (`api/`):** The backend service responsible for handling game requests, user authentication, and core game logic. It serves as the primary interface for client applications and provides the raw game-round data.
* **Return to Player (RTP) Engine (`rtp/`):** A critical component for calculating, validating, and monitoring Return to Player percentages across various games. It ensures fairness, regulatory compliance, and provides real-time insights into game performance.

### Component Interaction

The API component is the primary data source for the RTP Engine. It receives game requests and, upon completion of a game round, forwards the `betAmount`, `payout`, `gameId`, and `clientId` data to the RTP Engine. The RTP Engine then processes this data, performs statistical analysis, validates RTP against predefined thresholds, and can trigger alerts if deviations or anomalies are detected.

## Prerequisites & Setup

To get this monorepo up and running on your local machine, ensure you have the following system requirements and follow the setup steps below.

### System Requirements

* **Node.js**: Version 18.0.0 or higher.
* **npm**: (Comes bundled with Node.js).
* **Memory**: Minimum 4GB RAM, 8GB recommended for concurrent development and testing.
* **Network**: A stable internet connection for fetching dependencies and accessing any external services your API or RTP component might rely on.

### Initial Project Setup

1.  **Clone the Repository:**
    ```bash
    git clone <YOUR_REPOSITORY_URL>
    cd <your-monorepo-folder-name>
    ```

2.  **Install All Dependencies:**
    Navigate to the root of the monorepo (`your-monorepo-folder-name/`) and install all project dependencies. This command will install dependencies for both the root project and all configured workspaces (`api/` and `rtp/`).
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Both the API and RTP components require specific environment variables for their operation.
    * Create a `.env` file within the `api/` directory (e.g., for database connection strings, API port, authentication secrets).
    * Create a `.env` file within the `rtp/` directory (e.g., for API base URLs if RTP needs to call back to the API, or specific RTP threshold configurations).
    * **Refer to the individual component's `README.md` files for a detailed list of required environment variables.**

## Development Workflow

This monorepo is designed to facilitate independent development and testing of individual components, as well as integrated workflows.

### Running Components

You can start individual components or run them concurrently using the following root-level `npm` scripts:

* **Start the Gaming API Server:**
    ```bash
    npm run start:api
    ```

* **Start the RTP Monitor/Service:**
    ```bash
    npm run start:rtp-monitor
    ```

* **Run Both Simultaneously (Recommended for Integrated Development):**
    ```bash
    npm run dev
    ```
    *(This script uses `concurrently` to run both services in parallel, providing a realistic development environment.)*

### Running Tests

Automated tests are critical for ensuring the reliability and accuracy of both components.

* **Run All Tests (API & RTP):**
    ```bash
    npm test
    # Alternatively: npm run test-all
    ```
    *(This will execute all tests defined in both the `api/` and `rtp/` components.)*

* **Run API Tests Only:**
    ```bash
    npm run test:api
    ```

* **Run RTP Tests Only:**
    ```bash
    npm run test:rtp
    ```
    *(For faster iteration, you can `cd` into the respective `api/` or `rtp/` directory and run `npm test` there directly.)*

### Code Linting & Formatting

*(If you have linting/formatting tools configured, add commands here. Example:)*
* **Lint All Code:**
    ```bash
    npm run lint
    ```

### Generating Sample Data (for RTP)

The RTP component can generate sample game data for testing purposes:
```bash
npm run generate:rtp-sample-data