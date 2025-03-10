const express = require('express');
const http = require('http');
const connectDatabase = require('./config/database');
const SocketService = require('./config/socket');
const { APP_CONFIG } = require('./config/constants');
const postRoutes = require('./routes/post.routes');
const userRoutes = require('./routes/user.routes');
const commentRoutes = require('./routes/comment.routes');
const chatRoutes = require('./routes/chat.routes');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize socket service
const socketService = new SocketService(server);
app.set('socketService', socketService);

// Initialize database connection
connectDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDirs = ['uploads', 'uploads/images', 'uploads/documents', 'uploads/audio'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/posts', postRoutes);
app.use('/users', userRoutes);
app.use('/chats', chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: {
      code: 500,
      success: false,
      message: 'Internal server error'
    },
    errors: {
      description: err.message
    }
  });
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log('Port is already in use, trying another port...');
    setTimeout(() => {
      server.close();
      server.listen(port + 1);
    }, 1000);
  } else {
    console.error('Server error:', error);
  }
});

// Start server
const port = process.env.PORT || 3001;
server.listen(port, () => {  
  console.log(`Server is running on http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  console.log('Closing http server.');
  server.close(() => {
    console.log('Http server closed.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});