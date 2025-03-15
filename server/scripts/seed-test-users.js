const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB for seeding'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Test users data
const testUsers = [
    { name: 'Test User 1', email: 'user1@test.com' },
    { name: 'Test User 2', email: 'user2@test.com' },
    { name: 'Test User 3', email: 'user3@test.com' }
];

// Seed users
async function seedUsers() {
    try {
        // Clear existing users (optional - be careful in production!)
        await User.deleteMany({});

        // Create new users
        const createdUsers = await User.insertMany(testUsers);
        console.log('Test users created:', createdUsers);

        // Disconnect
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding users:', error);
        mongoose.connection.close();
    }
}

seedUsers();
