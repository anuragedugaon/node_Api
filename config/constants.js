// Application Configuration
const APP_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  PORT: process.env.PORT || 3000,
  MAX_DEVICES: 4,
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10
  }
};

// Database Configuration
const DB_CONFIG = {
  URL: process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/myapp',
  OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000
  }
};

// Schema Constants
const SCHEMA_CONSTANTS = {
  USER: {
    MIN_PASSWORD_LENGTH: 6,
    MAX_DEVICES: 4,
    ROLES: {
      ADMIN: 'admin',
      USER: 'user'
    }
  },
  POST: {
    MAX_TITLE_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 1000,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png']
  },
  COMMENT: {
    MAX_LENGTH: 500,
    MAX_REPLIES: 50
  }
};

// Response Messages
const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    LOGIN_FAILED: 'Login failed',
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Session expired, please login again',
    UNAUTHORIZED: 'Please authenticate to access'
  },
  USER: {
    CREATED: 'User created successfully',
    UPDATED: 'User updated successfully',
    DELETED: 'User deleted successfully',
    NOT_FOUND: 'User not found',
    DEVICE_LIMIT: 'Maximum device limit reached'
  },
  POST: {
    CREATED: 'Post created successfully',
    UPDATED: 'Post updated successfully',
    DELETED: 'Post deleted successfully',
    NOT_FOUND: 'Post not found',
    LIKED: 'Post liked successfully',
    UNLIKED: 'Post unliked successfully',
    SHARED: 'Post shared successfully'
  },
  COMMENT: {
    CREATED: 'Comment added successfully',
    UPDATED: 'Comment updated successfully',
    DELETED: 'Comment deleted successfully',
    NOT_FOUND: 'Comment not found',
    REPLY_ADDED: 'Reply added successfully'
  }
};

// Error Codes
const ERROR_CODES = {
  AUTH: {
    INVALID_TOKEN: 'AUTH001',
    SESSION_EXPIRED: 'AUTH002',
    INVALID_CREDENTIALS: 'AUTH003'
  },
  USER: {
    NOT_FOUND: 'USER001',
    ALREADY_EXISTS: 'USER002',
    INVALID_DATA: 'USER003'
  },
  POST: {
    NOT_FOUND: 'POST001',
    INVALID_DATA: 'POST002',
    UNAUTHORIZED: 'POST003'
  }
};

module.exports = {
  APP_CONFIG,
  DB_CONFIG,
  SCHEMA_CONSTANTS,
  MESSAGES,
  ERROR_CODES
}; 