const User = require('../models/userModel');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

/**
 * Register a new user
 */
exports.register = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // Create user
        user = new User({
            name,
            email,
            password,
            verificationToken,
            // In dev mode, auto-verify users
            isVerified: process.env.NODE_ENV === 'development'
        });

        await user.save();

        // Generate auth token
        const token = user.generateAuthToken();

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Login a user
 */
exports.login = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Generate token
        const token = user.generateAuthToken();

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
    // Client-side logout is handled by removing tokens
    res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res) => {
    try {
        // User is already attached to req by auth middleware
        res.json({
            success: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                roles: req.user.roles
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Verify email
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Find user by verification token
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Verify user
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
