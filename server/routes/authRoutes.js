const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Validation rules
const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

const passwordResetValidation = [
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

// Register user
router.post('/register', registerValidation, authController.register);

// Login user
router.post('/login', loginValidation, authController.login);

// Logout user
router.post('/logout', authController.logout);

// Get current user
router.get('/me', protect, authController.getCurrentUser);

// Verify email
router.get('/verify/:token', authController.verifyEmail);

// Request password reset
router.post('/forgot-password', authController.requestPasswordReset);

// Reset password
router.post('/reset-password', passwordResetValidation, authController.resetPassword);

module.exports = router;
