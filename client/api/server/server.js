const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import MongoDB connection
require('./config/mongoConfig');

// Import routes
const noteRoutes = require('./routes/noteRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for potentially large documents
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/notes', noteRoutes);
app.use('/api/suggestions', suggestionRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Collaborative Notes API is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
