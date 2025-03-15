// testFirebase.js
require('dotenv').config('.env');

const admin = require('firebase-admin');

// Make sure Firebase is initialized
const db = require('../server/config/firebaseConfig'); // Assuming firebaseConfig.js contains your initialization

async function testFirebase() {
  try {
    // Test writing to Firestore
    const docRef = db.collection('test').doc('sampleDoc');
    await docRef.set({
      name: 'Test User',
      email: 'testuser@example.com',
    });

    // Test reading from Firestore
    const doc = await docRef.get();
    if (doc.exists) {
      console.log('Firebase test successful: Document data:', doc.data());
    } else {
      console.log('No document found.');
    }
  } catch (error) {
    console.error('Firebase test failed:', error);
  }
}

testFirebase();