const mongoose = require('mongoose');
const moment = require('moment');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio'],
    default: 'text'
  },
  deliveryStatus: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    timestamp: {
      sent: Date,
      delivered: Date,
      read: Date
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: Date
  }],
  fileUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  fileDetails: {
    originalName: String,
    fileName: String,
    fileType: String,
    fileSize: Number,
    mimeType: String
  },
  timestamps: {
    sent: { type: Date, default: Date.now },
    delivered: Date,
    read: Date,
    modified: Date
  },
  formattedTime: {
    type: String,
    get: function() {
      const now = moment();
      const sent = moment(this.createdAt);
      
      if (now.diff(sent, 'days') === 0) {
        return sent.format('HH:mm'); // Today: show only time
      } else if (now.diff(sent, 'days') === 1) {
        return 'Yesterday ' + sent.format('HH:mm');
      } else if (now.diff(sent, 'days') < 7) {
        return sent.format('dddd HH:mm'); // Within a week: show day name
      } else {
        return sent.format('DD/MM/YYYY HH:mm'); // Older: show full date
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { getters: true }
});

// Add virtual field for message status
messageSchema.virtual('currentStatus').get(function() {
  if (this.readBy && this.readBy.length > 0) {
    return 'read';
  } else if (this.deliveryStatus.some(ds => ds.status === 'delivered')) {
    return 'delivered';
  }
  return 'sent';
});

// Add method to format time
messageSchema.methods.getFormattedTime = function() {
  const now = moment();
  const sent = moment(this.createdAt);
  
  if (now.diff(sent, 'days') === 0) {
    return sent.format('HH:mm'); // Today: show only time
  } else if (now.diff(sent, 'days') === 1) {
    return 'Yesterday ' + sent.format('HH:mm');
  } else if (now.diff(sent, 'days') < 7) {
    return sent.format('dddd HH:mm'); // Within a week: show day name
  }
  return sent.format('DD/MM/YYYY HH:mm'); // Older: show full date
};

module.exports = mongoose.model('Message', messageSchema); 