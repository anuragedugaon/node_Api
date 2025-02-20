const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { APP_CONFIG, MESSAGES, ERROR_CODES } = require('../config/constants');
const { sendSuccess, sendError, STATUS_CODES } = require('../utils/response.handler');
const bcrypt = require('bcrypt');
const TokenService = require('../utils/token.utils');

class AuthController {
  static async login(req, res) {
    try {
      const { email, password, deviceInfo } = req.body;
      const user = await User.findOne({ email });

      if (!user || !await bcrypt.compare(password, user.password)) {
        return sendError(res, {
          statusCode: STATUS_CODES.UNAUTHORIZED.code,
          message: MESSAGES.AUTH.INVALID_CREDENTIALS,
          errors: {
            code: ERROR_CODES.AUTH.INVALID_CREDENTIALS
          }
        });
      }

      // Handle device management
      if (user.devices.length >= APP_CONFIG.MAX_DEVICES) {
        return sendError(res, {
          message: MESSAGES.USER.DEVICE_LIMIT,
          errors: {
            code: ERROR_CODES.USER.DEVICE_LIMIT
          }
        });
      }

      const token = TokenService.generateToken(user._id);
      user.devices.push({
        ...deviceInfo,
        token,
        lastLogin: new Date()
      });

      await user.save();

      return sendSuccess(res, {
        message: MESSAGES.AUTH.LOGIN_SUCCESS,
        data: { 
          token, 
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        }
      });
    } catch (error) {
      return sendError(res, {
        message: MESSAGES.AUTH.LOGIN_FAILED,
        errors: {
          code: ERROR_CODES.AUTH.LOGIN_FAILED,
          description: error.message
        }
      });
    }
  }

  static generateToken(userId) {
    return jwt.sign({ id: userId }, APP_CONFIG.JWT_SECRET, {
      expiresIn: '30d'
    });
  }

  static async register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return sendError(res, {
          statusCode: STATUS_CODES.CONFLICT.code,
          message: 'Email already registered',
          errors: {
            code: ERROR_CODES.USER.ALREADY_EXISTS
          }
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword
      });

      await user.save();

      // Generate token
      const token = TokenService.generateToken(user._id);

      return sendSuccess(res, {
        statusCode: STATUS_CODES.CREATED.code,
        message: MESSAGES.USER.CREATED,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          },
          token
        }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Registration failed',
        errors: {
          code: ERROR_CODES.USER.INVALID_DATA,
          description: error.message
        }
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id).select('-password -devices');
      
      if (!user) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: MESSAGES.USER.NOT_FOUND
        });
      }

      return sendSuccess(res, {
        message: 'Profile fetched successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
          }
        }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to fetch profile',
        errors: {
          code: ERROR_CODES.USER.NOT_FOUND,
          description: error.message
        }
      });
    }
  }
}

module.exports = AuthController; 