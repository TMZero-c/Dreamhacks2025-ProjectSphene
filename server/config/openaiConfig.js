// /config/openaiConfig.js
require('dotenv').config('.env');  // To load environment variables from the .env file
const { OpenAI } = require('openai');  // Import OpenAI SDK

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // Use your environment variable for the API key
});

module.exports = openai;
