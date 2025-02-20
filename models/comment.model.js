const mongoose = require('mongoose');
const { SCHEMA_CONSTANTS } = require('../config/constants');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: SCHEMA_CONSTANTS.COMMENT.MAX_LENGTH
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  replies: [{
    content: {
      type: String,
      maxlength: SCHEMA_CONSTANTS.COMMENT.MAX_LENGTH
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', commentSchema); 