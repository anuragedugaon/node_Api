const jwt = require('jsonwebtoken');
const { APP_CONFIG } = require('../config/constants');

/**
 * Token Service
 * Utility functions for token generation and verification
 */
class TokenService {
  // Generate new token
  static generateToken(userId, deviceInfo = {}) {
    return jwt.sign(
      { 
        id: userId,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName
      }, 
      APP_CONFIG.JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  // Verify token
  static verifyToken(token) {
    try {
      return jwt.verify(token, APP_CONFIG.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Extract user ID from token
  static getUserIdFromToken(token) {
    const decoded = this.verifyToken(token);
    return decoded.id;
  }

  // Extract device info from token
  static getDeviceInfoFromToken(token) {
    const decoded = this.verifyToken(token);
    return {
      deviceId: decoded.deviceId,
      deviceName: decoded.deviceName
    };
  }
}

module.exports = TokenService; 