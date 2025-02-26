const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { APP_CONFIG } = require('./constants');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.onlineUsers = new Map();
    this.initialize();
  }

  initialize() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('Authentication error');
        }
        const decoded = jwt.verify(token, APP_CONFIG.JWT_SECRET);
        socket.userId = decoded.id;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.userId);
      this.onlineUsers.set(socket.userId, socket.id);

      // Emit online status
      this.io.emit('user:online', {
        userId: socket.userId,
        online: true
      });

      // Join user's rooms (personal room for private messages)
      socket.join(socket.userId);

      // Handle chat events
      socket.on('message:send', (data) => this.handleNewMessage(socket, data));
      socket.on('message:typing', (data) => this.handleTyping(socket, data));
      socket.on('message:read', (data) => this.handleMessageRead(socket, data));
      socket.on('message:delivered', (data) => this.handleMessageDelivered(socket, data));

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
        this.onlineUsers.delete(socket.userId);
        this.io.emit('user:online', {
          userId: socket.userId,
          online: false,
          lastSeen: new Date()
        });
      });
    });
  }

  handleNewMessage(socket, data) {
    const { chatId, message } = data;
    
    // Emit to all users in the chat except sender
    socket.to(chatId).emit('message:received', {
      chatId,
      message: {
        ...message,
        sender: socket.userId,
        timestamps: {
          sent: new Date(),
          delivered: new Date()
        },
        status: 'delivered'
      }
    });
  }

  handleTyping(socket, data) {
    const { chatId, isTyping } = data;
    socket.to(chatId).emit('user:typing', {
      chatId,
      userId: socket.userId,
      isTyping
    });
  }

  handleMessageRead(socket, data) {
    const { chatId, messageIds } = data;
    const now = new Date();

    // Emit to all users in chat
    socket.to(chatId).emit('message:status', {
      messageIds,
      userId: socket.userId,
      status: 'read',
      timestamp: now
    });
  }

  handleMessageDelivered(socket, data) {
    const { messageId, timestamp } = data;
    
    // Emit to message sender
    socket.to(data.senderId).emit('message:status', {
      messageId,
      userId: socket.userId,
      status: 'delivered',
      timestamp
    });
  }

  // Helper methods
  emitToUser(userId, event, data) {
    const socketId = this.onlineUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  emitToChat(chatId, event, data) {
    this.io.to(chatId).emit(event, data);
  }
}

module.exports = SocketService; 