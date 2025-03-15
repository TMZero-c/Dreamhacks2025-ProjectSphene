// testOpenAI.js
require('dotenv').config();

const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Assuming your API key is in .env
});
const openai = new OpenAIApi(configuration);

async function testOpenAI() {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: "Say hello to the world.",
      max_tokens: 10,
    });
    console.log('OpenAI response:', response.data.choices[0].text.trim());
  } catch (error) {
    console.error('OpenAI test failed:', error);
  }
}

testOpenAI();
