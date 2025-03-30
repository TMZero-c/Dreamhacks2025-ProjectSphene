const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/mongoConfig');
const { apiLimiter, authLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
    credentials: true
}));

// Log all requests
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    next();
});

// Add rate limiting middleware
app.use('/api/auth', authLimiter); // Apply auth rate limiter to auth routes
app.use('/api', apiLimiter); // Apply API rate limiter to all API routes

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/lectures', require('./routes/lectureRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
// Add other routes here...

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
