const mongoose = require('mongoose');

const TestResultSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    gameId: {
        type: String,
        required: true
    },
    testType: {
        type: String,
        enum: ['rtp-simulation', 'compliance-check', 'load-test'],
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    duration: Number, // in milliseconds
    parameters: {
        spinCount: Number,
        betAmount: Number,
        concurrency: Number
    },
    results: {
        totalSpins: Number,
        totalBet: Number,
        totalPayout: Number,
        calculatedRTP: Number,
        expectedRTP: Number,
        variance: Number,
        isCompliant: Boolean
    },
    statistics: {
        meanRTP: Number,
        medianRTP: Number,
        minRTP: Number,
        maxRTP: Number,
        stdDev: Number
    },
    status: {
        type: String,
        enum: ['running', 'completed', 'failed'],
        default: 'running'
    },
    errorLog: [String],
    environment: {
        type: String,
        enum: ['dev', 'staging', 'prod'],
        required: true
    },
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Indexes for faster querying
TestResultSchema.index({ gameId: 1, testType: 1, startTime: -1 });
TestResultSchema.index({ 'results.calculatedRTP': 1 });
TestResultSchema.index({ status: 1 });

// Pre-save hook to calculate duration
TestResultSchema.pre('save', function(next) {
    if (this.isModified('endTime') && this.endTime) {
        this.duration = this.endTime - this.startTime;
    }
    next();
});

module.exports = mongoose.model('TestResult', TestResultSchema);