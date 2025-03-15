// testBoth.js
require('dotenv').config();

const admin = require('firebase-admin');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Firebase setup
const db = require('../server/config/firebaseConfig'); // Firebase initialization

// OpenAI setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function testBoth() {
  try {
    // Test OpenAI API
    const openAIResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: "What is the capital of France?",
      max_tokens: 10,
    });
    console.log('OpenAI response:', openAIResponse.data.choices[0].text.trim());

    // Test Firebase Firestore
    const docRef = db.collection('test').doc('openai-test');
    await docRef.set({
      openaiAnswer: openAIResponse.data.choices[0].text.trim(),
    });

    // Test reading from Firestore
    const doc = await docRef.get();
    if (doc.exists) {
      console.log('Firebase test successful: Document data:', doc.data());
    } else {
      console.log('No document found.');
    }
  } catch (error) {
    console.error('Error during combined test:', error);
  }
}

testBoth();
