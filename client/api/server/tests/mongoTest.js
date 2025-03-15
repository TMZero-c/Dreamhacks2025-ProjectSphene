require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Test MongoDB connection
async function testMongoDB() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully!');

        // Test creating a user
        const testUser = new User({
            name: 'Test User',
            email: 'test@example.com'
        });

        // Save the user to the database
        await testUser.save();
        console.log('Test user created:', testUser);

        // Find the user in the database
        const foundUser = await User.findOne({ email: 'test@example.com' });
        console.log('Found user:', foundUser);

        // Clean up - delete the test user
        await User.deleteOne({ email: 'test@example.com' });
        console.log('Test user deleted');

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('MongoDB test failed:', error);
    }
}

testMongoDB();
