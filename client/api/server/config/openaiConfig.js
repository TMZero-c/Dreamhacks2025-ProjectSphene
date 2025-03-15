// OpenAI configuration
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { OpenAI } = require('openai/index.mjs');

const apiKey = process.env.OPENAI_API_KEY;
console.log(`OpenAI API Key ${apiKey ? 'is set' : 'is NOT set'}`);

if (!apiKey) {
  console.warn('WARNING: OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

module.exports = openai;
