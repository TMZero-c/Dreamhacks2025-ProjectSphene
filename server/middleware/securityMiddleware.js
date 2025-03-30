const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const express = require('express');

/**
 * Configure all security middleware
 * @param {Object} app - Express app
 */
exports.setupSecurity = (app) => {
    // Cookie parser (required for CSRF and auth cookies)
    app.use(cookieParser(process.env.COOKIE_SECRET));

    // Body parser (already included in Express)
    app.use(express.json({ limit: '10kb' }));

    // Security HTTP headers
    app.use(helmet());

    // CORS configuration
    const corsOptions = {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true, // Allow cookies to be sent
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };
    app.use(cors(corsOptions));

    // Rate limiting to prevent brute force attacks
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later'
    });
    app.use('/api/', limiter);

    // Data sanitization against NoSQL query injection
    app.use(mongoSanitize());

    // Data sanitization against XSS
    app.use(xss());

    // Prevent parameter pollution
    app.use(hpp({
        whitelist: ['userId', 'lectureId'] // Allow specific duplicates if needed
    }));

    // CSRF protection (only for routes that use cookies)
    if (process.env.NODE_ENV === 'production') {
        const csrfProtection = csurf({
            cookie: {
                secure: true,
                httpOnly: true,
                sameSite: 'none'
            }
        });

        // Apply CSRF protection to mutating routes
        app.use('/api/auth/login', csrfProtection);
        app.use('/api/auth/register', csrfProtection);
        app.use('/api/notes', csrfProtection);
        app.use('/api/lectures', csrfProtection);
        app.use('/api/suggestions', csrfProtection);

        // Route to get CSRF token
        app.get('/api/csrf-token', csrfProtection, (req, res) => {
            res.json({ csrfToken: req.csrfToken() });
        });
    }
};

/**
 * Global error handler
 */
exports.errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error values
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Server Error';

    // Handle specific error types
    if (err.code === 11000) {
        // MongoDB duplicate key error
        return res.status(400).json({
            success: false,
            message: 'Duplicate field value entered'
        });
    }

    if (err.name === 'ValidationError') {
        // Mongoose validation error
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            message: messages.join(', ')
        });
    }

    // Send limited error info in production
    if (process.env.NODE_ENV === 'production') {
        return res.status(statusCode).json({
            success: false,
            message: statusCode === 500 ? 'Server Error' : message
        });
    }

    // Send detailed error in development
    return res.status(statusCode).json({
        success: false,
        message,
        stack: err.stack,
        error: err
    });
};
