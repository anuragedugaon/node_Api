const { ResponseHandler, STATUS_CODES } = require('../utils/response.handler');
const { sendError } = ResponseHandler;
const TokenService = require('../utils/token.utils');
const User = require('../models/user.model');
const { MESSAGES } = require('../config/constants');

/**
 * Authentication Middleware
 * Verifies token for all protected routes
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return sendError(res, {
        statusCode: STATUS_CODES.UNAUTHORIZED.code,
        message: MESSAGES.AUTH.UNAUTHORIZED
      });
    }

    try {
      // Verify token
      const userId = TokenService.getUserIdFromToken(token);
      const deviceInfo = TokenService.getDeviceInfoFromToken(token);

      // Find user in database
      const user = await User.findOne({
        _id: userId,
        'devices.deviceId': deviceInfo.deviceId,
        'devices.isActive': true
      });

      if (!user) {
        return sendError(res, {
          statusCode: STATUS_CODES.UNAUTHORIZED.code,
          message: MESSAGES.USER.NOT_FOUND
        });
      }

      // Set user and device info in request
      req.user = user;
      req.deviceInfo = deviceInfo;
      next();

    } catch (error) {
      return sendError(res, {
        statusCode: STATUS_CODES.UNAUTHORIZED.code,
        message: MESSAGES.AUTH.TOKEN_EXPIRED,
        errors: {
          code: 'INVALID_TOKEN',
          description: error.message
        }
      });
    }

  } catch (error) {
    return sendError(res, {
      statusCode: STATUS_CODES.SERVER_ERROR.code,
      message: 'Authentication failed',
      errors: {
        code: 'AUTH_ERROR',
        description: error.message
      }
    });
  }
};

module.exports = authMiddleware; 