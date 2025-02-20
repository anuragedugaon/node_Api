const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const AuthController = require('../controllers/auth.controller');

// Auth routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// User routes
router.get('/profile', authMiddleware, AuthController.getProfile);

module.exports = router; 