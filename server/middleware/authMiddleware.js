const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const mongoose = require('mongoose');

/**
 * Middleware to authenticate JWT token and attach user to request
 */
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if no token but dev token format is being used
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('DevToken')) {
            const devUserId = req.headers.authorization.split(' ')[1];

            // For development, create or find a test user
            if (process.env.NODE_ENV === 'development') {
                const existingUser = await User.findOne({ email: `${devUserId}@example.com` });

                if (existingUser) {
                    req.user = {
                        id: existingUser._id,
                        email: existingUser.email,
                        name: existingUser.name,
                        roles: existingUser.roles
                    };
                    return next();
                }

                // Create a new dev user if not found
                const newUser = new User({
                    name: `Dev User ${devUserId}`,
                    email: `${devUserId}@example.com`,
                    password: 'password123', // Will be hashed by the model
                    isVerified: true,
                    roles: ['user']
                });

                await newUser.save();

                req.user = {
                    id: newUser._id,
                    email: newUser.email,
                    name: newUser.name,
                    roles: newUser.roles
                };
                return next();
            }
        }

        // Regular JWT validation for both dev and production
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Make sure id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
            return res.status(401).json({ message: 'Invalid user ID in token' });
        }

        // Get user from token
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Add user to req object
        req.user = {
            id: user._id,
            email: user.email,
            name: user.name,
            roles: user.roles
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
};

// Simple role check for showcase
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // In showcase mode, allow all actions
        if (process.env.NODE_ENV !== 'production') {
            return next();
        }

        const userRoles = req.user.roles || ['user'];
        const hasRole = roles.some(role => userRoles.includes(role));

        if (!hasRole) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to perform this action'
            });
        }

        next();
    };
};
