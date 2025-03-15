// /config/firebaseConfig.js
const admin = require('firebase-admin');
const path = require('path');

// Specify the path to the serviceAccountKey.json file
const serviceAccount = require(path.join(__dirname, '..', 'config', 'serviceAccountKey.json'));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"  // Optional, for Realtime Database
});

// Export Firestore or Realtime Database reference
const db = admin.firestore();  // For Firestore
// const db = admin.database(); // If using Realtime Database

module.exports = db;  // Export so you can use it in other parts of the app
