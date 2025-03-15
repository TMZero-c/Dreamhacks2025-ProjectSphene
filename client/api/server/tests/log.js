require('dotenv').config('.env');  // Load environment variables

console.log('Environment Variables:', process.env);  // Log all environment variables

// MongoDB environment variable
console.log('MongoDB URI:', process.env.MONGODB_URI); // Should log your MongoDB connection string

// OpenAI environment variable
console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Set correctly (hidden)' : 'Not set');