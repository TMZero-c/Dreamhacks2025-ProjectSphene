// /config/firebaseConfig.js
const admin = require('firebase-admin');
require('dotenv').config('.env');
// const path = require('path');

// Specify the path to the serviceAccountKey.json file
const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),  // Handle newline characters
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
};



// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com"  // Optional, for Realtime Database
});

// Export Firestore or Realtime Database reference
const db = admin.firestore();  // For Firestore
// const db = admin.database(); // If using Realtime Database

module.exports = db;  // Export so you can use it in other parts of the app

