RTP Gaming Validation Engine
============================

Overview
--------

A streamlined RTP (Return to Player) accuracy validation engine designed for modern gaming platforms. This system leverages Playwright for robust browser automation and API interaction, enabling comprehensive testing of games from various company domains. It focuses on collecting real game round data (bets and payouts) directly from API endpoints or through UI interaction, performing statistical analysis, and generating compliance reports.

Objective
---------

Build and maintain a focused RTP testing platform that:

*   Tests games directly from company domains by interacting with their APIs and/or UIs.
    
*   Validates RTP accuracy against configurable statistical thresholds.
    
*   Collects game round data (bets and payouts) efficiently, primarily via API calls for high-volume testing.
    
*   Generates comprehensive statistical analysis and compliance reports.
    
*   Maximizes accuracy through parallel execution and robust authentication handling.
    

📋 Prerequisites & Setup
------------------------

### System Requirements

*   **Node.js**: >= 18.0.0
    
*   **Memory**: Minimum 4GB RAM (8GB recommended for concurrent testing)
    
*   **Network**: Stable connection to company domains and their API endpoints.
    

### Initial Project Setup

#### 1\. Install Core Dependencies

  # Install all required dependencies (including Playwright and dotenv)  npm install  
    
  # Install Playwright browsers (Chromium, Firefox, WebKit)  npx playwright install  # Verify Playwright installation  npx playwright --version   `

#### 2\. Configure Company Domains & Environment Variables

This project uses .env for sensitive credentials and config/domains.js for structured platform configurations.

  # .env Example  

* PLAY TEST Platform * CredentialsPLAY\_TEST\_USERNAME=your\_play\_test\_username\_herePLAY\_TEST\_PASSWORD=your\_play\_test\_password\_herePLAY\_TEST\_LOGIN\_URL=https://playgamestest.ibibe.cloud/auth/signinPLAY\_TEST\_API\_BASE\_URL=https://admin-api.ibibe.africaPLAY\_TEST\_GAME\_LIST\_ENDPOINT=/api/v1/gamesPLAY\_TEST\_SPIN\_GAME\_ENDPOINT=/api/v1/games/{gameId}/spin 

// Optional, if your API has a direct spin endpointPLAY\_TEST\_GAME\_BASE\_URL=https://playgamestest.ibibe.cloud/game-view

* CASINO CLIENT Platform * CredentialsCASINO\_CLIENT\_USERNAME=your\_casino\_client\_username\_hereCASINO\_CLIENT\_PASSWORD=your\_casino\_client\_password\_hereCASINO\_CLIENT\_LOGIN\_URL=https://casino.client.ibibe.africa/auth/signinCASINO\_CLIENT\_API\_BASE\_URL=https://admin-api3.ibibe.africaCASINO\_CLIENT\_GAME\_LIST\_ENDPOINT=/api/v1/gamesCASINO\_CLIENT\_SPIN\_GAME\_ENDPOINT=/api/v1/games/{gameId}/spin  *

* OptionalCASINO\_CLIENT\_GAME\_BASE\_URL=https://casino.client.ibibe.africa/game-view# General Configuration for RTP Test (used by test-thresholds or other config files)RTP\_TEST\_SPINS=5000RTP\_BATCH\_SIZE=500TEST\_GAME\_COUNT=2 *  

# Number of games to test per platform (for quick runs)
    
*   \# Copy and configure domain settingscp config/domains.example.js config/domains.jscp config/test-thresholds.example.js config/test-thresholds.js# Edit config/domains.js to align with your .env variables and API structures.# Ensure it uses ES Module syntax (import/export).
    

#### 3\. Update Playwright Global Setup Selectors

The playwright-globe-setup.js file handles multi-platform authentication. You **must** update the CSS selectors within this file to match your actual login pages.

*   **Inspect your login pages:** Use your browser's Developer Tools (F12) to find the precise CSS selectors for:
    
    *   The initial "Login" button (if it reveals the form).
        
    *   The username/email input field.
        
    *   The password input field.
        
    *   The final "Sign In" / "Submit" button on the login form.
        
*   **Update playwright-globe-setup.js:** Replace the placeholder selectors in playwright-globe-setup.js with the ones you found. This file should also be an ES Module.
    

🗂️ Streamlined Folder Structure
--------------------------------

The project follows a modular and streamlined structure to enhance maintainability and clarity. All JavaScript files are configured as **ES Modules**.

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   RTP/  ├── config/  │   ├── domains.js                 # ✅ Centralized platform configurations (ES Module)  │   └── test-thresholds.js         # ✅ All test & validation thresholds (ES Module)  ├── src/  │   ├── utils/  │   │   ├── accuracy-calc.js       # ✅ RTP calculations (ES Module)  │   │   ├── logger.js              # ✅ Logging system (ES Module)  │   │   └── game-api-client.js     # ✅ NEW: API client for game interactions (ES Module)  ├── tests/  │   └── rtp-valid.spec.js          # ✅ Comprehensive Playwright test suite (ES Module)  ├── playwright-globe-setup.js      # ✅ Multi-platform authentication setup (ES Module)  ├── playwright-globe-teardown.js   # ✅ Global teardown for cleanup (ES Module)  ├── .env                           # ✅ Environment variables (sensitive data)  ├── node_modules/  ├── playwright-report/  ├── package.json                   # ✅ Streamlined dependencies, "type": "module"  └── README.md                      # ✅ This documentation   `

### Consolidation Benefits

*   **ES Module Consistency**: All core JS files use modern ES Module syntax.
    
*   **Clear Responsibility**: Each file serves a single, focused purpose.
    
*   **Automated Authentication**: Global setup handles login for all configured platforms.
    
*   **API-Driven Testing**: Direct API calls for game data enhance speed and reliability.
    
*   **Better Maintainability**: Less scattered code, easier debugging.
    

🔧 NPM Tools & Dependencies
---------------------------

### Core Dependencies

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "dependencies": {      "axios": "^1.10.0",           // API communication (if used outside Playwright's request)      "chalk": "^4.1.2",           // Colored console output      "js-yaml": "^4.1.0",         // Swagger YAML file parsing (if still used)      "lodash": "^4.17.21",        // Data manipulation utilities      "winston": "^3.17.0",        // Logging system      "mathjs": "^13.2.0",          // Statistical calculations      "dotenv": "^16.4.5"           // Environment variable loading    },    "devDependencies": {      "@playwright/test": "^1.53.0", // Main testing framework      "@types/node": "^24.0.3"       // Node.js type definitions    }  }   `

### Essential NPM Scripts

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "scripts": {      "test": "npx playwright test",             # Primary command to run all Playwright RTP tests      "test:report": "npx playwright show-report", # View the latest HTML report      "clean:reports": "rm -rf playwright-report playwright-debug-screenshots playwright-auth-state-*.json" # Clean generated files      # Other scripts (e.g., for specific analysis, discovery) can be added as needed.    }  }   `

🚀 Project Initialization & Execution
-------------------------------------

### First-Time Setup (Streamlined)

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   # 1. Clone the repository  git clone   cd rtp-gaming-api # Or your project's root directory  # 2. Install Node.js dependencies  npm install  # 3. Install Playwright browsers  npx playwright install  # 4. Configure environment variables  # Create a .env file at the project root and fill in your credentials and URLs  # (See "Configure Company Domains & Environment Variables" section above)  # 5. Run the RTP validation tests  npm run test   `

### Daily Usage Commands

#### Start Testing

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   # Run complete RTP validation across all configured platforms  npm run test  # To run tests for a specific company (e.g., 'playtest')  # npx playwright test --project=playtest  # To run tests with detailed output (e.g., 'line' reporter)  # npm run test -- --reporter=line   `

#### Analysis & Reporting

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   # Generate and view the latest HTML report  npm run test:report  # Clean up generated reports and authentication states  npm run clean:reports   `

🌐 API-Driven Testing Workflow
------------------------------

The RTP validation now primarily relies on direct API calls to your backend for game round data, ensuring high-volume, efficient testing.

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   graph TD      A[Playwright Global Setup] --> B{Login to Each Platform}      B -- Saves Auth State --> C[Playwright Test (rtp-valid.spec.js)]      C -- Uses Auth State --> D[Fetch Games List via API (request.get)]      D -- Game List Received --> E[Iterate Through Games]      E --> F{For Each Game & Spin}      F -- Calls API for Spin --> G[API Branch (triggerGameSpin)]      G -- Returns Bet/Payout --> H[Collect Results in Test]      H --> I[Calculate RTP]      I --> J[Validate & Report]   `

### Execution Details

*   **Multi-Platform Authentication:** Handled by playwright-globe-setup.js, saving separate authentication states for each configured company.
    
*   **Game Discovery:** rtp-valid.spec.js uses Playwright's authenticated request fixture to call your API branch's gameListEndpoint (e.g., /api/v1/games) to get the list of available games.
    
*   **API-Driven Game Play:** For each game, rtp-valid.spec.js makes repeated API calls to your API branch's game spin endpoint (e.g., /api/v1/games/{gameId}/spin) via src/utils/game-api-client.js. Your API branch is expected to process the spin and return the betAmount and payout for that round.
    
*   **RTP Calculation & Reporting:** The collected bet and win data from API responses are used by src/utils/accuracy-calc.js to calculate RTP, which is then logged and reported.
    

📊 Consolidated Reporting & Analysis
------------------------------------

### Unified Reporting System

All reporting functionality is managed by Playwright's built-in reporters and custom logging:

*   **HTML Report**: Interactive test results dashboard generated by Playwright (npx playwright show-report).
    
*   **Console Logs**: Detailed step-by-step output during test execution.
    
*   **Screenshots**: Debugging screenshots saved during authentication failures or game loading issues.
    

### Report Structure

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   playwright-report/            # Generated by Playwright for HTML report  playwright-debug-screenshots/ # Contains screenshots from global setup/test runs  playwright-auth-state-*.json  # Saved authentication states (cleaned by npm run clean:reports)   `

### Accessing Reports

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   # Open the latest HTML report in your browser  npm run test:report   `

🔍 Troubleshooting
------------------

### Common Issues & Solutions

#### Authentication Failures (TimeoutError on Login)

**Issue:** Playwright times out when trying to find login form elements (usernameSelector, passwordSelector, submitButtonSelector, initialLoginButtonSelector).**Solution:** This means the CSS selectors in playwright-globe-setup.js are incorrect.

*   **Action:** Manually inspect your login pages using browser Developer Tools (F12) to find the _exact_ and _unique_ CSS selectors for each input field and button. Update playwright-globe-setup.js with these precise selectors.
    
*   **Debugging:** Run npm run test with headless: false and check the playwright-debug-screenshots/ folder for visual clues (\*-login-page.png, \*-failure-page.png).
    

#### API Call Failures (404 Not Found, Invalid games response format)

**Issue:** API calls to fetch game lists return 404 or unexpected data format.**Solution:**

*   **404:** Your PLAY\_TEST\_API\_BASE\_URL/CASINO\_CLIENT\_API\_BASE\_URL or PLAY\_TEST\_GAME\_LIST\_ENDPOINT/CASINO\_CLIENT\_GAME\_LIST\_ENDPOINT in your .env file are incorrect.
    
    *   **Action:** Verify these URLs/endpoints by inspecting network requests on your live game platform using browser Developer Tools (Network tab).
        
*   **Invalid Format:** The rtp-valid.spec.js is not correctly parsing the API response for the game list.
    
    *   **Action:** Log the full responseData in rtp-valid.spec.js and adjust the if (responseData && responseData.games) logic to match the actual JSON structure.
        

#### SyntaxError: Cannot use 'import.meta' outside a module

**Issue:** Node.js is treating a file as CommonJS despite it using ES Module syntax.**Solution:**

*   **Action:** Ensure your project's root package.json file has "type": "module" at the top level. Also, confirm all imported local .js files (like those in config/ and src/utils/) are also using ES Module syntax (import/export default).
    

#### url.includes is not a function

**Issue:** Occurs in page.waitForURL callback.**Solution:** The url object provided by Playwright's callback needs to be converted to a string.

*   **Action:** Change url.includes(pattern) to url.toString().includes(pattern). (This should already be fixed in the latest playwright-globe-setup.js I provided).
    

📈 Success Metrics
------------------

*   **Automation Level**: 100% automated RTP validation workflow, driven by API interactions.
    
*   **Test Coverage**: All games from configured company domains are discoverable and testable.
    
*   **Accuracy**: High-volume spins per game with statistical validation.
    
*   **Performance**: Efficient testing cycle due to API-driven game play.
    
*   **Reliability**: Robust authentication and error handling for consistent test completion.
    
*   **Maintainability**: Clear file structure and ES Module consistency for easier updates.