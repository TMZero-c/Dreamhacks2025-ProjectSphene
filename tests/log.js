require('dotenv').config('.env');  // Load environment variables

console.log('Environment Variables:', process.env);  // Log all environment variables

console.log(process.env.FIREBASE_PROJECT_ID);  // Should log your project ID
console.log(process.env.FIREBASE_PRIVATE_KEY);  // Should log the private key or undefined if not loaded
console.log(process.env.FIREBASE_CLIENT_EMAIL);  // Should log your client email