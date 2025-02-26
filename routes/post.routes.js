const express = require('express');
const router = express.Router();
const PostController = require('../controllers/post.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../utils/file.utils');

// Post CRUD with image upload
router.post('/', 
  authMiddleware, 
  upload.single('image'), 
  PostController.createPost
);

router.get('/', authMiddleware, PostController.getAllPosts);
router.get('/:postId', authMiddleware, PostController.getPostById);
router.put('/:postId', 
  authMiddleware, 
  upload.single('image'),
  PostController.updatePost
);
router.delete('/:postId', authMiddleware, PostController.deletePost);

// Post interactions
router.post('/:postId/like', authMiddleware, PostController.likePost);
router.post('/:postId/share', authMiddleware, PostController.sharePost);

// Comments
router.post('/:postId/comments', authMiddleware, PostController.addComment);
router.get('/:postId/comments', authMiddleware, PostController.getComments);

module.exports = router; 