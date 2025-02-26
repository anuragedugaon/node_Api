const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const ChatController = require('../controllers/chat.controller');
const upload = require('../utils/file.utils');

// Chat routes
router.post('/', authMiddleware, ChatController.startChat);
router.get('/', authMiddleware, ChatController.getChats);
router.get('/:chatId/messages', authMiddleware, ChatController.getChatMessages);
router.post('/:chatId/messages', authMiddleware, ChatController.sendMessage);

// Group chat routes
router.post('/:chatId/members', authMiddleware, ChatController.addToGroup);
router.delete('/:chatId/members/:userId', authMiddleware, ChatController.removeFromGroup);

// File routes
router.post('/:chatId/files/image', 
  authMiddleware, 
  upload.single('image'), 
  ChatController.sendFileMessage
);

router.post('/:chatId/files/document', 
  authMiddleware, 
  upload.single('document'), 
  ChatController.sendFileMessage
);

router.post('/:chatId/files/audio', 
  authMiddleware, 
  upload.single('audio'), 
  ChatController.sendFileMessage
);

// Add these routes
router.get('/:chatId/messages/recent', authMiddleware, ChatController.getRecentMessages);
router.post('/:chatId/messages/read', authMiddleware, ChatController.markAsRead);
router.post('/:chatId/typing', authMiddleware, ChatController.updateTypingStatus);
router.post('/:chatId/messages/delivered', authMiddleware, ChatController.markAsDelivered);
router.delete('/:chatId', authMiddleware, ChatController.deleteChat);
router.delete('/:chatId/messages', authMiddleware, ChatController.clearChat);
router.get('/:chatId/messages/search', authMiddleware, ChatController.searchMessages);

module.exports = router; 