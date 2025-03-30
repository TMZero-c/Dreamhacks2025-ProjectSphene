// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
    // In Vercel, environment variables are available directly
    if (!process.env.VERCEL) {
        require('dotenv').config({ path: '.env.production' });
    }
} else {
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { setupSecurity, errorHandler } = require('./middleware/securityMiddleware');
const authRoutes = require('./routes/authRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const noteRoutes = require('./routes/noteRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');

// Initialize app
const app = express();

// Apply security middleware
setupSecurity(app);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/suggestions', suggestionRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../client/dist')));

    // Any route that doesn't match an API route should be sent the React app
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
    });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handler
app.use(errorHandler);

// Connect to MongoDB
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        isConnected = true;
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Connect to the database
connectToDatabase();

// For local development
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Don't crash in production, but log the error
    if (process.env.NODE_ENV === 'development') {
        process.exit(1);
    }
});

// Export for Vercel serverless deployment
module.exports = app;
