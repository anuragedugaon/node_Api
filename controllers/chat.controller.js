const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const { ResponseHandler, STATUS_CODES } = require('../utils/response.handler');
const { sendSuccess, sendError } = ResponseHandler;
const moment = require('moment');

class ChatController {
  // Start new chat or get existing
  static async startChat(req, res) {
    try {
      const { userId, type, groupName } = req.body;
      
      if (type === 'individual') {
        // Check if chat already exists
        let chat = await Chat.findOne({
          type: 'individual',
          participants: { 
            $all: [req.user._id, userId],
            $size: 2
          }
        }).populate('participants', 'name email');

        if (chat) {
          return sendSuccess(res, {
            message: 'Chat retrieved successfully',
            data: { chat }
          });
        }

        // Create new chat
        chat = new Chat({
          participants: [req.user._id, userId],
          type: 'individual'
        });

        await chat.save();
        await chat.populate('participants', 'name email');

        return sendSuccess(res, {
          statusCode: STATUS_CODES.CREATED.code,
          message: 'Chat created successfully',
          data: { chat }
        });
      } else {
        // Create group chat
        const chat = new Chat({
          participants: [req.user._id, ...req.body.participants],
          type: 'group',
          groupName,
          groupAdmin: req.user._id
        });

        await chat.save();
        await chat.populate('participants groupAdmin', 'name email');

        return sendSuccess(res, {
          statusCode: STATUS_CODES.CREATED.code,
          message: 'Group created successfully',
          data: { chat }
        });
      }
    } catch (error) {
      return sendError(res, {
        message: 'Failed to create chat',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Get user's chats
  static async getChats(req, res) {
    try {
      const chats = await Chat.find({
        participants: req.user._id
      })
      .populate('participants lastMessage', 'name email content createdAt')
      .sort('-lastMessage.createdAt');

      return sendSuccess(res, {
        message: 'Chats fetched successfully',
        data: { chats }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to fetch chats',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Get chat messages
  static async getChatMessages(req, res) {
    try {
      const { chatId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const messages = await Message.find({ chat: chatId })
        .populate('sender', 'name email')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit);

      // Mark messages as read
      await Message.updateMany(
        {
          chat: chatId,
          'readBy.user': { $ne: req.user._id }
        },
        {
          $push: {
            readBy: {
              user: req.user._id,
              readAt: new Date()
            }
          }
        }
      );

      return sendSuccess(res, {
        message: 'Messages fetched successfully',
        data: { messages }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to fetch messages',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Get recent messages with pagination and real-time updates
  static async getRecentMessages(req, res) {
    try {
      const { chatId } = req.params;
      const { lastMessageId, limit = 20 } = req.query;
      
      let query = { chat: chatId };
      if (lastMessageId) {
        query._id = { $lt: lastMessageId };
      }

      const messages = await Message.find(query)
        .populate('sender', 'name email')
        .sort('-timestamps.sent')
        .limit(parseInt(limit));

      // Mark messages as read
      const unreadMessages = messages.filter(msg => 
        msg.sender._id.toString() !== req.user._id.toString() &&
        !msg.readBy.some(read => read.user.toString() === req.user._id.toString())
      );

      if (unreadMessages.length > 0) {
        await Message.updateMany(
          {
            _id: { $in: unreadMessages.map(m => m._id) }
          },
          {
            $push: {
              readBy: {
                user: req.user._id,
                readAt: new Date()
              }
            },
            $set: {
              'timestamps.read': new Date(),
              status: 'read'
            }
          }
        );
      }

      return sendSuccess(res, {
        message: 'Messages fetched successfully',
        data: {
          messages: messages.map(msg => ({
            ...msg.toJSON(),
            timeAgo: moment(msg.timestamps.sent).fromNow(),
            isMyMessage: msg.sender._id.toString() === req.user._id.toString()
          }))
        }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to fetch messages',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Send message with detailed status
  static async sendMessage(req, res) {
    try {
      const { chatId } = req.params;
      const { content } = req.body;
      const socketService = req.app.get('socketService');

      const chat = await Chat.findById(chatId)
        .populate('participants', 'name email');

      if (!chat) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Chat not found'
        });
      }

      // Create initial delivery status for all participants
      const deliveryStatus = chat.participants
        .filter(p => p._id.toString() !== req.user._id.toString())
        .map(p => ({
          user: p._id,
          status: 'sent',
          timestamp: {
            sent: new Date()
          }
        }));

      const message = new Message({
        chat: chatId,
        sender: req.user._id,
        content,
        deliveryStatus,
        readBy: [{
          user: req.user._id,
          readAt: new Date()
        }]
      });

      await message.save();
      await message.populate([
        { path: 'sender', select: 'name email' },
        { path: 'deliveryStatus.user', select: 'name email' },
        { path: 'readBy.user', select: 'name email' }
      ]);

      // Update chat with last message
      chat.lastMessage = message._id;
      chat.unreadCounts = chat.participants
        .filter(p => p._id.toString() !== req.user._id.toString())
        .map(p => ({
          user: p._id,
          count: (chat.unreadCounts.find(uc => 
            uc.user.toString() === p._id.toString()
          )?.count || 0) + 1
        }));

      await chat.save();

      // Prepare detailed message info
      const messageInfo = {
        _id: message._id,
        content: message.content,
        sender: {
          _id: message.sender._id,
          name: message.sender.name,
          email: message.sender.email
        },
        deliveryStatus: message.deliveryStatus.map(ds => ({
          user: {
            _id: ds.user._id,
            name: ds.user.name,
            email: ds.user.email
          },
          status: ds.status,
          timestamp: ds.timestamp
        })),
        readBy: message.readBy.map(rb => ({
          user: {
            _id: rb.user._id,
            name: rb.user.name,
            email: rb.user.email
          },
          readAt: rb.readAt
        })),
        formattedTime: message.getFormattedTime(),
        currentStatus: message.currentStatus,
        createdAt: message.createdAt
      };

      // Emit to all participants
      socketService.emitToChat(chatId, 'message:new', {
        chatId,
        message: messageInfo
      });

      return sendSuccess(res, {
        statusCode: STATUS_CODES.CREATED.code,
        message: 'Message sent successfully',
        data: { message: messageInfo }
      });

    } catch (error) {
      return sendError(res, {
        message: 'Failed to send message',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Group chat functions
  static async addToGroup(req, res) {
    try {
      const { chatId } = req.params;
      const { userIds } = req.body;

      const chat = await Chat.findOne({
        _id: chatId,
        type: 'group',
        groupAdmin: req.user._id
      });

      if (!chat) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Group not found or unauthorized'
        });
      }

      chat.participants.push(...userIds);
      await chat.save();
      await chat.populate('participants', 'name email');

      return sendSuccess(res, {
        message: 'Members added successfully',
        data: { chat }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to add members',
        errors: {
          description: error.message
        }
      });
    }
  }

  static async removeFromGroup(req, res) {
    try {
      const { chatId, userId } = req.params;

      const chat = await Chat.findOne({
        _id: chatId,
        type: 'group',
        groupAdmin: req.user._id
      });

      if (!chat) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Group not found or unauthorized'
        });
      }

      chat.participants = chat.participants.filter(
        p => p.toString() !== userId
      );
      await chat.save();
      await chat.populate('participants', 'name email');

      return sendSuccess(res, {
        message: 'Member removed successfully',
        data: { chat }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to remove member',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Add this method to ChatController
  static async sendFileMessage(req, res) {
    try {
      const { chatId } = req.params;
      const { content } = req.body;
      const file = req.file;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Chat not found'
        });
      }

      // Determine message type based on file
      let messageType = 'text';
      if (file) {
        if (file.mimetype.startsWith('image/')) {
          messageType = 'image';
        } else if (file.mimetype.startsWith('audio/')) {
          messageType = 'audio';
        } else {
          messageType = 'file';
        }
      }

      const message = new Message({
        chat: chatId,
        sender: req.user._id,
        content: content || file.originalname,
        type: messageType,
        fileUrl: file ? `/uploads/${file.filename}` : null,
        fileDetails: file ? {
          originalName: file.originalname,
          fileName: file.filename,
          fileType: messageType,
          fileSize: file.size,
          mimeType: file.mimetype
        } : null,
        readBy: [{ user: req.user._id }]
      });

      await message.save();
      await message.populate('sender', 'name email');

      // Update last message in chat
      chat.lastMessage = message._id;
      chat.unreadCounts = chat.participants
        .filter(p => p.toString() !== req.user._id.toString())
        .map(p => ({
          user: p,
          count: (chat.unreadCounts.find(uc => 
            uc.user.toString() === p.toString()
          )?.count || 0) + 1
        }));

      await chat.save();

      return sendSuccess(res, {
        statusCode: STATUS_CODES.CREATED.code,
        message: 'File sent successfully',
        data: { message }
      });

    } catch (error) {
      return sendError(res, {
        message: 'Failed to send file',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Mark messages as delivered
  static async markAsDelivered(req, res) {
    try {
      const { chatId } = req.params;
      const now = new Date();

      const messages = await Message.find({
        chat: chatId,
        sender: { $ne: req.user._id },
        'deliveryStatus.user': req.user._id,
        'deliveryStatus.status': 'sent'
      });

      for (const message of messages) {
        const deliveryStatus = message.deliveryStatus.find(
          ds => ds.user.toString() === req.user._id.toString()
        );
        if (deliveryStatus) {
          deliveryStatus.status = 'delivered';
          deliveryStatus.timestamp.delivered = now;
          await message.save();

          // Notify sender
          req.app.get('socketService').emitToUser(
            message.sender.toString(),
            'message:delivered',
            {
              messageId: message._id,
              userId: req.user._id,
              timestamp: now
            }
          );
        }
      }

      return sendSuccess(res, {
        message: 'Messages marked as delivered'
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to mark messages as delivered',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Mark messages as read
  static async markAsRead(req, res) {
    try {
      const { chatId } = req.params;
      const now = new Date();

      await Message.updateMany(
        {
          chat: chatId,
          sender: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id }
        },
        {
          $push: {
            readBy: {
              user: req.user._id,
              readAt: now
            }
          },
          $set: {
            'timestamps.read': now,
            status: 'read'
          }
        }
      );

      // Reset unread count for this user
      await Chat.updateOne(
        { _id: chatId },
        {
          $set: {
            'unreadCounts.$[elem].count': 0
          }
        },
        {
          arrayFilters: [{ 'elem.user': req.user._id }]
        }
      );

      return sendSuccess(res, {
        message: 'Messages marked as read'
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to mark messages as read',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Add method for typing status
  static async updateTypingStatus(req, res) {
    try {
      const { chatId } = req.params;
      const { isTyping } = req.body;
      const socketService = req.app.get('socketService');

      socketService.emitToChat(chatId, 'user:typing', {
        chatId,
        userId: req.user._id,
        isTyping
      });

      return sendSuccess(res, {
        message: 'Typing status updated'
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to update typing status',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Delete chat
  static async deleteChat(req, res) {
    try {
      const { chatId } = req.params;
      
      const chat = await Chat.findOne({
        _id: chatId,
        participants: req.user._id
      });

      if (!chat) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Chat not found'
        });
      }

      // Delete all messages
      await Message.deleteMany({ chat: chatId });
      await chat.remove();

      return sendSuccess(res, {
        message: 'Chat deleted successfully'
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to delete chat',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Clear chat messages
  static async clearChat(req, res) {
    try {
      const { chatId } = req.params;
      
      const chat = await Chat.findOne({
        _id: chatId,
        participants: req.user._id
      });

      if (!chat) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Chat not found'
        });
      }

      await Message.deleteMany({ chat: chatId });
      chat.lastMessage = null;
      await chat.save();

      return sendSuccess(res, {
        message: 'Chat cleared successfully'
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to clear chat',
        errors: {
          description: error.message
        }
      });
    }
  }

  // Search messages
  static async searchMessages(req, res) {
    try {
      const { chatId } = req.params;
      const { query } = req.query;
      
      const messages = await Message.find({
        chat: chatId,
        content: { $regex: query, $options: 'i' }
      })
      .populate('sender', 'name email')
      .sort('-createdAt');

      return sendSuccess(res, {
        message: 'Messages found',
        data: { messages }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Search failed',
        errors: {
          description: error.message
        }
      });
    }
  }
}

module.exports = ChatController; 