// Application Configuration
const APP_CONFIG = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  MAX_DEVICES: 5
};

const STATUS_CODES = {
  OK: { code: 200, message: 'Success' },
  CREATED: { code: 201, message: 'Created Successfully' },
  BAD_REQUEST: { code: 400, message: 'Bad Request' },
  UNAUTHORIZED: { code: 401, message: 'Unauthorized' },
  FORBIDDEN: { code: 403, message: 'Forbidden' },
  NOT_FOUND: { code: 404, message: 'Not Found' },
  CONFLICT: { code: 409, message: 'Conflict' },
  SERVER_ERROR: { code: 500, message: 'Internal Server Error' }
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
    ROLES: {
      USER: 'user',
      ADMIN: 'admin'
    }
  },
  POST: {
    MAX_TITLE_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 1000,
    ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png']
  },
  COMMENT: {
    MAX_LENGTH: 500
  }
};

// Response Messages
const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    LOGIN_FAILED: 'Login failed',
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Please authenticate',
    TOKEN_EXPIRED: 'Token has expired'
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
  }
};

// Error Codes
const ERROR_CODES = {
  AUTH: {
    INVALID_CREDENTIALS: 'AUTH001',
    TOKEN_EXPIRED: 'AUTH002',
    LOGIN_FAILED: 'AUTH003',
    INVALID_TOKEN: 'AUTH004',
    RESET_FAILED: 'AUTH005',
    INVALID_OTP: 'AUTH006',
    VERIFICATION_FAILED: 'AUTH007'
  },
  USER: {
    NOT_FOUND: 'USER001',
    ALREADY_EXISTS: 'USER002',
    INVALID_DATA: 'USER003',
    DEVICE_LIMIT: 'USER004'
  }
};

module.exports = {
  APP_CONFIG,
  STATUS_CODES,
  DB_CONFIG,
  SCHEMA_CONSTANTS,
  MESSAGES,
  ERROR_CODES
}; 