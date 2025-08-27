const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  userId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  room: {
    type: String,
    default: 'general'
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  // Instagram-specific fields
  source: {
    type: String,
    enum: ['local', 'instagram'],
    default: 'local'
  },
  instagramSenderId: String,
  instagramMessageId: String,
  instagramThreadId: String,
  isFromInstagram: {
    type: Boolean,
    default: false
  },
  isToInstagram: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Index for efficient querying
messageSchema.index({ room: 1, timestamp: -1 })
messageSchema.index({ sender: 1, timestamp: -1 })
messageSchema.index({ source: 1, timestamp: -1 })
messageSchema.index({ instagramSenderId: 1 })

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  return this.timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
})

// Ensure virtual fields are serialized
messageSchema.set('toJSON', {
  virtuals: true
})

module.exports = mongoose.model('Message', messageSchema)
