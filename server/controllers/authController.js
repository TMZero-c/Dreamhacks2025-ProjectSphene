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
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
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

        // In production, would send verification email here
        if (process.env.NODE_ENV !== 'development') {
            // Pseudo-code for sending email
            // await sendVerificationEmail(user.email, verificationToken);
            console.log(`Would send verification email to ${email} with token ${verificationToken}`);
        }

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                isVerified: user.isVerified
            },
            message: process.env.NODE_ENV === 'development'
                ? 'Account created successfully'
                : 'Account created successfully. Please check your email to verify your account.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create account. Please try again.'
        });
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
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // If email verification is required, check if user is verified
        if (process.env.NODE_ENV !== 'development' && !user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email address before logging in'
            });
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
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
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
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        // Verify user
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        // Generate auth token
        const authToken = user.generateAuthToken();

        res.json({
            success: true,
            message: 'Email verified successfully',
            token: authToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during email verification'
        });
    }
};

/**
 * Request password reset
 */
exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If this email exists, a password reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Set token and expiry
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // In production, would send reset email here
        if (process.env.NODE_ENV !== 'development') {
            // Pseudo-code for sending email
            // await sendPasswordResetEmail(user.email, resetToken);
            console.log(`Would send password reset email to ${email} with token ${resetToken}`);
        }

        res.json({
            success: true,
            message: 'If this email exists, a password reset link has been sent'
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password reset request'
        });
    }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Find user by reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password reset'
        });
    }
};
