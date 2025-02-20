const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { SCHEMA_CONSTANTS } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']    
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: SCHEMA_CONSTANTS.USER.MIN_PASSWORD_LENGTH
  },
  role: {
    type: String,
    enum: Object.values(SCHEMA_CONSTANTS.USER.ROLES),
    default: SCHEMA_CONSTANTS.USER.ROLES.USER
  },
  devices: [{
    deviceId: String,
    deviceName: String,
    lastLogin: Date,
    token: String,
    isActive: { type: Boolean, default: true }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 