const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['comments', 'mentions', 'live_comments', 'message_reactions', 'message_postbacks', 'message_referrals', 'message_seen', 'flow_execution', 'webhook_error']
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  content: {
    text: String,
    media: String,
    url: String
  },
  userInfo: {
    username: String,
    userId: String,
    profilePicture: String
  },
  postInfo: {
    postId: String,
    postUrl: String,
    postType: String
  },
  liveInfo: {
    liveId: String,
    isLive: Boolean,
    liveTitle: String
  },
  reactionInfo: {
    reactionType: String,
    messageId: String
  },
  pageId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingError: String,
  flowResponse: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for efficient querying
webhookEventSchema.index({ userId: 1, timestamp: -1 });
webhookEventSchema.index({ eventType: 1, timestamp: -1 });
webhookEventSchema.index({ pageId: 1, timestamp: -1 });
webhookEventSchema.index({ isProcessed: 1 });

// Virtual for formatted timestamp
webhookEventSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Method to mark as processed
webhookEventSchema.methods.markAsProcessed = function() {
  this.isProcessed = true;
  return this.save();
};

// Method to mark as read
webhookEventSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Static method to get events by user
webhookEventSchema.statics.getEventsByUser = function(userId, limit = 50, offset = 0) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(offset);
};

// Static method to get unprocessed events
webhookEventSchema.statics.getUnprocessedEvents = function(userId) {
  return this.find({ userId, isProcessed: false })
    .sort({ timestamp: -1 });
};

// Static method to get events by type
webhookEventSchema.statics.getEventsByType = function(userId, eventType, limit = 50) {
  return this.find({ userId, eventType })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get events count by type
webhookEventSchema.statics.getEventCountsByType = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$eventType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get events in date range
webhookEventSchema.statics.getEventsInDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: -1 });
};

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);

module.exports = WebhookEvent;
