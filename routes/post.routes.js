const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const PostController = require('../controllers/post.controller');
const ShareController = require('../controllers/share.controller');
const InteractionController = require('../controllers/interaction.controller');

// Post CRUD routes
router.post('/', authMiddleware, PostController.create);
router.get('/:postId', PostController.getById);
router.put('/:postId', authMiddleware, PostController.update);
router.delete('/:postId', authMiddleware, PostController.delete);

// Interaction routes
router.post('/:postId/like', authMiddleware, PostController.toggleLike);
router.post('/:postId/share', authMiddleware, ShareController.sharePost);
router.get('/:postId/likes', authMiddleware, InteractionController.getLikes);
router.get('/:postId/shares', authMiddleware, InteractionController.getShares);

module.exports = router; 