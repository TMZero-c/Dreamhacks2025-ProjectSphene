require('dotenv').config();  // Correct path to the .env file

const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // or any other model you want to use
      messages: [{ role: "user", content: "Say hello to the world." }],
    });
    console.log('OpenAI response:', response.choices[0].message.content.trim());
  } catch (error) {
    console.error('OpenAI test failed:', error);
  }
}

testOpenAI();
