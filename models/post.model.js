const mongoose = require('mongoose');
const { SCHEMA_CONSTANTS } = require('../config/constants');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: SCHEMA_CONSTANTS.POST.MAX_TITLE_LENGTH
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: SCHEMA_CONSTANTS.POST.MAX_DESCRIPTION_LENGTH
  },
  image: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        const fileType = v.split('.').pop().toLowerCase();
        return SCHEMA_CONSTANTS.POST.ALLOWED_IMAGE_TYPES.includes(fileType);
      },
      message: 'Invalid image format'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  comments: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date
  }],
  likesCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema); 