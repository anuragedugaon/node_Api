const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const AuthController = require('../controllers/auth.controller');

// Auth routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Password reset flow
router.post('/forgot-password', AuthController.forgotPassword); // Step 1: Request OTP
router.post('/verify-otp', AuthController.verifyOTP); // Step 2: Verify OTP
router.post('/reset-password', AuthController.resetPassword); // Step 3: Reset password

// User routes
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);

module.exports = router; 