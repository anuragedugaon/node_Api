const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Comment routes
router.post('/', authMiddleware, (req, res) => {
  // Create comment implementation
});

router.post('/:commentId/reply', authMiddleware, (req, res) => {
  // Add reply implementation
});

module.exports = router; 