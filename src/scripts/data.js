// scripts/generate-sample-data.js
const fs = require('fs');
const path = require('path');
const RTPUtils = require('../tests/utils'); // Assuming utils is available at this path

/**
 * Generates sample game round data for testing RTP.
 * Data conforms to the Shared Data Model: { "betAmount": "number", "payout": "number", "gameId": "string", "clientId": "string" }
 */
class SampleDataGenerator {
    constructor(config) {
        this.numRounds = config.numRounds || 1000;
        this.outputFile = config.outputFile || path.join(__dirname, '../data/sample-game-data.json');
        this.gameIds = config.gameIds || ['slot-game-A', 'roulette-game-B', 'blackjack-game-C'];
        this.clientIds = config.clientIds || ['client-101', 'client-102', 'client-103', 'client-104', 'client-105'];
        this.betRange = config.betRange || { min: 1, max: 100 }; // Bet amount range
        this.targetRTPs = config.targetRTPs || { // Target RTPs for different games
            'slot-game-A': 96.0,
            'roulette-game-B': 97.3,
            'blackjack-game-C': 99.5
        };
        // Simple payout distribution based on target RTP (simplified for sample data)
        this.payoutVariance = config.payoutVariance || 0.1; // Percentage of bet as variance
    }

    /**
     * Generates a single game round.
     * @param {string} gameId - The ID of the game.
     * @returns {object} A game round object.
     */
    generateGameRound(gameId) {
        const betAmount = parseFloat(RTPUtils.getRandomNumber(this.betRange.min, this.betRange.max).toFixed(2));
        const targetRTP = this.targetRTPs[gameId] || 95.0; // Default if gameId not found
        
        // Calculate a payout close to the target RTP, with some variance
        let idealPayout = (betAmount * targetRTP) / 100;
        let payoutVarianceAmount = betAmount * this.payoutVariance * RTPUtils.getRandomNumber(-1, 1);
        let payout = parseFloat((idealPayout + payoutVarianceAmount).toFixed(2));

        // Ensure payout is not negative
        if (payout < 0) payout = 0;
        // Optionally, cap payout at a reasonable multiple of bet (e.g., 5x bet for slots)
        if (payout > betAmount * 5) payout = betAmount * 5; 

        const clientId = this.clientIds[Math.floor(Math.random() * this.clientIds.length)];

        return {
            betAmount,
            payout,
            gameId,
            clientId,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generates a specified number of sample game rounds and saves to a file.
     */
    generateAndSave() {
        RTPUtils.log(`Generating ${this.numRounds} sample game rounds...`);
        const gameData = [];
        for (let i = 0; i < this.numRounds; i++) {
            const gameId = this.gameIds[Math.floor(Math.random() * this.gameIds.length)];
            gameData.push(this.generateGameRound(gameId));
        }

        const dir = path.dirname(this.outputFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.outputFile, JSON.stringify(gameData, null, 2), 'utf8');
        RTPUtils.log(`Generated sample data saved to: ${this.outputFile}`, 'success');
    }
}

// Configuration for generating sample data
const config = {
    numRounds: 5000, // Number of game rounds to generate
    outputFile: path.join(__dirname, '../data/sample-game-data.json'),
    gameIds: ['game-slot-01', 'game-roulette-02', 'game-blackjack-03'],
    clientIds: ['player-alpha', 'player-beta', 'player-gamma', 'player-delta', 'player-epsilon'],
    betRange: { min: 0.5, max: 200 },
    targetRTPs: {
        'game-slot-01': 96.5,
        'game-roulette-02': 97.3,
        'game-blackjack-03': 99.2
    },
    payoutVariance: 0.2 // Max 20% deviation from ideal payout for a single round (simulates win/loss)
};

const generator = new SampleDataGenerator(config);
generator.generateAndSave();