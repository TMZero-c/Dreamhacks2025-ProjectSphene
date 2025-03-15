const openai = require('../config/openaiConfig');
require('dotenv').config({ path: '../.env' });

// Function to test OpenAI API connection
async function testOpenAI() {
    try {
        console.log('Testing OpenAI connection...');

        // Simple completion request to test the connection
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Generate a one-sentence suggestion about bees." }
            ],
            max_tokens: 100
        });

        console.log('OpenAI Response:');
        console.log(response.choices[0].message.content);
        console.log('API connection successful!');
    } catch (error) {
        console.error('Error connecting to OpenAI API:');
        console.error(error);
    }
}

// Run the test
testOpenAI();
