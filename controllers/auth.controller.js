const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { APP_CONFIG, MESSAGES, ERROR_CODES, SCHEMA_CONSTANTS } = require('../config/constants');
const { ResponseHandler, STATUS_CODES } = require('../utils/response.handler');
const bcrypt = require('bcrypt');
const TokenService = require('../utils/token.utils');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Replace sendSuccess and sendError with ResponseHandler
const { sendSuccess, sendError } = ResponseHandler;

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

  static async updateProfile(req, res) {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id);

      if (!user) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: MESSAGES.USER.NOT_FOUND
        });
      }

      // If email is being updated, check if new email already exists
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return sendError(res, {
            statusCode: STATUS_CODES.CONFLICT.code,
            message: 'Email already in use',
            errors: {
              code: ERROR_CODES.USER.ALREADY_EXISTS
            }
          });
        }
        user.email = email;
      }

      // Update name if provided
      if (name) {
        user.name = name;
      }

      // Handle password update if provided
      if (currentPassword && newPassword) {
        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
          return sendError(res, {
            statusCode: STATUS_CODES.UNAUTHORIZED.code,
            message: 'Current password is incorrect',
            errors: {
              code: ERROR_CODES.AUTH.INVALID_CREDENTIALS
            }
          });
        }

        // Validate new password length
        if (newPassword.length < SCHEMA_CONSTANTS.USER.MIN_PASSWORD_LENGTH) {
          return sendError(res, {
            statusCode: STATUS_CODES.BAD_REQUEST.code,
            message: `Password must be at least ${SCHEMA_CONSTANTS.USER.MIN_PASSWORD_LENGTH} characters long`,
            errors: {
              code: ERROR_CODES.USER.INVALID_DATA
            }
          });
        }

        // Hash and set new password
        user.password = await bcrypt.hash(newPassword, 10);
      }

      await user.save();

      return sendSuccess(res, {
        message: MESSAGES.USER.UPDATED,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            updatedAt: new Date()
          }
        }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to update profile',
        errors: {
          code: ERROR_CODES.USER.INVALID_DATA,
          description: error.message
        }
      });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'No account found with this email',
          errors: {
            code: ERROR_CODES.USER.NOT_FOUND
          }
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = Date.now() + 600000; // 10 minutes

      // Save OTP to user
      user.otp = {
        code: await bcrypt.hash(otp, 10),
        expiry: otpExpiry
      };
      await user.save();

      // For development/testing, log the OTP
      console.log('Generated OTP:', otp);

      return sendSuccess(res, {
        message: 'OTP generated successfully',
        data: {
          message: `For testing purposes, OTP: ${otp}`,
          email: user.email
        }
      });

    } catch (error) {
      return sendError(res, {
        message: 'Failed to generate OTP',
        errors: {
          code: ERROR_CODES.AUTH.RESET_FAILED,
          description: error.message
        }
      });
    }
  }

  static async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ 
        email,
        'otp.expiry': { $gt: Date.now() }
      });

      if (!user) {
        return sendError(res, {
          statusCode: STATUS_CODES.BAD_REQUEST.code,
          message: 'Invalid or expired OTP',
          errors: {
            code: ERROR_CODES.AUTH.INVALID_OTP
          }
        });
      }

      // Verify OTP
      const isValidOTP = await bcrypt.compare(otp, user.otp.code);
      if (!isValidOTP) {
        return sendError(res, {
          statusCode: STATUS_CODES.BAD_REQUEST.code,
          message: 'Invalid OTP',
          errors: {
            code: ERROR_CODES.AUTH.INVALID_OTP
          }
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.resetPasswordExpire = Date.now() + 300000; // 5 minutes
      user.otp = undefined; // Clear OTP
      await user.save();

      return sendSuccess(res, {
        message: 'OTP verified successfully',
        data: {
          resetToken,
          message: 'Please proceed to reset your password'
        }
      });

    } catch (error) {
      return sendError(res, {
        message: 'OTP verification failed',
        errors: {
          code: ERROR_CODES.AUTH.VERIFICATION_FAILED,
          description: error.message
        }
      });
    }
  }
  static async resetPassword(req, res) {
    try {
      const { resetToken, newPassword, confirmPassword } = req.body;
  
      // Check if required fields are present
      if (!resetToken || !newPassword || !confirmPassword) {
        return sendError(res, {
          statusCode: STATUS_CODES.BAD_REQUEST.code,
          message: 'Please provide all required fields',
          errors: {
            code: ERROR_CODES.USER.INVALID_DATA
          }
        });
      }
  
      // Check if passwords match
      if (newPassword !== confirmPassword) {
        return sendError(res, {
          statusCode: STATUS_CODES.BAD_REQUEST.code,
          message: 'Passwords do not match',
          errors: {
            code: ERROR_CODES.USER.INVALID_DATA
          }
        });
      }
  
      // Validate password length
      if (newPassword.length < SCHEMA_CONSTANTS.USER.MIN_PASSWORD_LENGTH) {
        return sendError(res, {
          statusCode: STATUS_CODES.BAD_REQUEST.code,
          message: `Password must be at least ${SCHEMA_CONSTANTS.USER.MIN_PASSWORD_LENGTH} characters long`,
          errors: {
            code: ERROR_CODES.USER.INVALID_DATA
          }
        });
      }
  
      // Get hashed token
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
  
      // Find user with valid reset token and expiration
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
      });
  
      if (!user) {
        return sendError(res, {
          statusCode: STATUS_CODES.BAD_REQUEST.code,
          message: 'Invalid or expired reset token',
          errors: {
            code: ERROR_CODES.AUTH.INVALID_TOKEN
          }
        });
      }
  
      // Update password
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
  
      // Save updated user object
      await user.save();
  
      return sendSuccess(res, {
        message: 'Password reset successful',
        data: {
          message: 'You can now login with your new password'
        }
      });
  
    } catch (error) {
      console.error('Error resetting password:', error); // Log the error for debugging purposes
      return sendError(res, {
        message: 'Failed to reset password',
        errors: {
          code: ERROR_CODES.AUTH.RESET_FAILED,
          description: error.message
        }
      });
    }
  }
  


}

module.exports = AuthController; 