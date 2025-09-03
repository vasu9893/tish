const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  // Event identification
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Event metadata
  eventType: {
    type: String,
    required: true,
    enum: [
      'comments',
      'live_comments', 
      'messages',
      'message_reactions',
      'message_postbacks',
      'message_referrals',
      'message_seen',
      'mentions'
    ],
    index: true
  },
  
  // Instagram account information
  accountId: {
    type: String,
    required: true,
    index: true
  },
  
  // Sender and recipient information
  senderId: {
    type: String,
    required: true,
    index: true
  },
  
  recipientId: {
    type: String,
    required: true,
    index: true
  },
  
  // Event payload and content
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Content extraction for easy access
  content: {
    text: String,
    mediaUrl: String,
    mediaType: String,
    replyTo: String,
    parentId: String
  },
  
  // User information from payload
  userInfo: {
    username: String,
    fullName: String,
    profilePicture: String,
    verified: Boolean
  },
  
  // Processing status
  processedStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'retry'],
    default: 'pending',
    index: true
  },
  
  // Processing metadata
  processingAttempts: {
    type: Number,
    default: 0
  },
  
  lastProcessingAttempt: Date,
  
  processingError: String,
  
  // Timestamps
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // Meta webhook metadata
  webhookMetadata: {
    hubMode: String,
    hubVerifyToken: String,
    hubTimestamp: String,
    hubSignature: String
  },
  
  // Deduplication
  deduplicationKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Integration tracking
  integrationStatus: {
    queued: { type: Boolean, default: false },
    queuedAt: Date,
    processedByQueue: { type: Boolean, default: false },
    queueProcessingTime: Number
  }
}, {
  timestamps: true,
  // Indexes for performance
  indexes: [
    { eventType: 1, timestamp: -1 },
    { accountId: 1, timestamp: -1 },
    { senderId: 1, timestamp: -1 },
    { processedStatus: 1, timestamp: -1 },
    { deduplicationKey: 1 }
  ]
});

// Generate deduplication key
webhookEventSchema.methods.generateDeduplicationKey = function() {
  return `${this.eventType}_${this.accountId}_${this.senderId}_${this.timestamp.getTime()}`;
};

// Check if event is duplicate
webhookEventSchema.statics.isDuplicate = async function(deduplicationKey) {
  const existing = await this.findOne({ deduplicationKey });
  return !!existing;
};

// Get recent events by type
webhookEventSchema.statics.getRecentByType = async function(eventType, limit = 50) {
  return this.find({ eventType })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('-payload -webhookMetadata');
};

// Get events by account
webhookEventSchema.statics.getByAccount = async function(accountId, limit = 100) {
  return this.find({ accountId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('-payload -webhookMetadata');
};

// Get unprocessed events
webhookEventSchema.statics.getUnprocessed = async function(limit = 100) {
  return this.find({ 
    processedStatus: { $in: ['pending', 'failed'] },
    processingAttempts: { $lt: 3 }
  })
    .sort({ timestamp: 1 })
    .limit(limit);
};

// Mark as processed
webhookEventSchema.methods.markAsProcessed = function() {
  this.processedStatus = 'completed';
  this.lastProcessingAttempt = new Date();
  return this.save();
};

// Mark as failed
webhookEventSchema.methods.markAsFailed = function(error, incrementAttempts = true) {
  this.processedStatus = 'failed';
  this.processingError = error;
  this.lastProcessingAttempt = new Date();
  
  if (incrementAttempts) {
    this.processingAttempts += 1;
  }
  
  return this.save();
};

// Retry processing
webhookEventSchema.methods.retry = function() {
  this.processedStatus = 'pending';
  this.lastProcessingAttempt = new Date();
  return this.save();
};

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
