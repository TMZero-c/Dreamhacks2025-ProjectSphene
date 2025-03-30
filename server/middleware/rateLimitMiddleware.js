const rateLimit = require('express-rate-limit');

// Create a rate limiter for general API routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute window
    max: 200, // Limit each IP to 200 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests, please try again later.',
    skip: (req) => process.env.NODE_ENV === 'development', // Skip rate limiting in development
});

// Create a more lenient limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 20, // Limit each IP to 20 login/register attempts per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again later.',
    skip: (req) => process.env.NODE_ENV === 'development', // Skip rate limiting in development
});

module.exports = {
    apiLimiter,
    authLimiter
};
