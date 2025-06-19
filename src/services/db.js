// src/services/database.js
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/api-config');

module.exports = {
  connect: async () => {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  },
  disconnect: async () => {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};