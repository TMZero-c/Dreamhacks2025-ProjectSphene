require('dotenv').config();

// MongoDB setup
const mongoose = require('mongoose');

// OpenAI setup
const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// MongoDB Schema
const messageSchema = new mongoose.Schema({
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

// Connect to MongoDB
async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Function to test OpenAI API
async function testOpenAI() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // You can change the model if needed
      messages: [{ role: 'user', content: 'Say hello to the world.' }],
    });

    console.log('OpenAI response:', response.choices[0].message.content.trim());
    return response.choices[0].message.content.trim(); // Return OpenAI response
  } catch (error) {
    console.error('OpenAI test failed:', error);
    throw error;
  }
}

// Function to save OpenAI response to MongoDB
async function saveToMongoDB(content) {
  try {
    const message = new Message({ content });
    await message.save();
    console.log('Message saved to MongoDB');
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
  }
}

// Main function to test both MongoDB and OpenAI
async function testMongoAndOpenAI() {
  // Connect to MongoDB
  await connectMongoDB();

  // Get OpenAI response
  const openAIResponse = await testOpenAI();

  // Save OpenAI response to MongoDB
  await saveToMongoDB(openAIResponse);

  // Fetch and display the saved message
  const messages = await Message.find();
  console.log('Messages in MongoDB:', messages);
}

// Run the test
testMongoAndOpenAI();
