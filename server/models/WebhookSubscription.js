const mongoose = require('mongoose');

const webhookSubscriptionSchema = new mongoose.Schema({
  // Subscription identification
  subscriptionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Instagram account this subscription belongs to
  instagramAccountId: {
    type: String,
    required: true,
    index: true
  },
  
  // User who owns this subscription
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Meta webhook subscription details
  metaSubscription: {
    subscriptionId: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'failed'],
      default: 'pending'
    },
    lastVerified: Date,
    verificationAttempts: { type: Number, default: 0 }
  },
  
  // Webhook fields subscribed to
  subscribedFields: [{
    field: {
      type: String,
      enum: [
        'comments',
        'live_comments',
        'messages',
        'message_reactions',
        'message_postbacks',
        'message_referrals',
        'message_seen',
        'mentions'
      ]
    },
    enabled: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now }
  }],
  
  // Webhook endpoint configuration
  webhookConfig: {
    url: {
      type: String,
      required: true
    },
    verifyToken: {
      type: String,
      required: true
    },
    secret: {
      type: String,
      required: true
    },
    active: { type: Boolean, default: true }
  },
  
  // Processing configuration
  processingConfig: {
    enableQueue: { type: Boolean, default: true },
    batchSize: { type: Number, default: 100 },
    retryAttempts: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 5000 }, // 5 seconds
    enableDeduplication: { type: Boolean, default: true }
  },
  
  // Notification settings
  notifications: {
    email: { type: Boolean, default: false },
    emailAddress: String,
    push: { type: Boolean, default: true },
    slack: { type: Boolean, default: false },
    slackWebhook: String
  },
  
  // Statistics
  stats: {
    totalEvents: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },
    failedDeliveries: { type: Number, default: 0 },
    lastEventAt: Date,
    averageProcessingTime: Number
  },
  
  // Status and metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'error'],
    default: 'active',
    index: true
  },
  
  lastActivity: Date,
  
  errorCount: { type: Number, default: 0 },
  
  lastError: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  indexes: [
    { instagramAccountId: 1, status: 1 },
    { userId: 1, status: 1 },
    { 'subscribedFields.field': 1 },
    { status: 1, lastActivity: -1 }
  ]
});

// Generate subscription ID
webhookSubscriptionSchema.methods.generateSubscriptionId = function() {
  return `sub_${this.instagramAccountId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

// Check if field is subscribed
webhookSubscriptionSchema.methods.isFieldSubscribed = function(field) {
  const subscription = this.subscribedFields.find(sub => sub.field === field);
  return subscription && subscription.enabled;
};

// Enable/disable field subscription
webhookSubscriptionSchema.methods.toggleField = function(field, enabled = true) {
  const subscription = this.subscribedFields.find(sub => sub.field === field);
  if (subscription) {
    subscription.enabled = enabled;
    subscription.subscribedAt = new Date();
  } else if (enabled) {
    this.subscribedFields.push({
      field,
      enabled: true,
      subscribedAt: new Date()
    });
  }
  return this.save();
};

// Update statistics
webhookSubscriptionSchema.methods.updateStats = function(eventData) {
  this.stats.totalEvents += 1;
  this.stats.lastEventAt = new Date();
  
  if (eventData.success) {
    this.stats.successfulDeliveries += 1;
  } else {
    this.stats.failedDeliveries += 1;
  }
  
  if (eventData.processingTime) {
    const currentAvg = this.stats.averageProcessingTime || 0;
    const totalEvents = this.stats.totalEvents;
    this.stats.averageProcessingTime = (currentAvg * (totalEvents - 1) + eventData.processingTime) / totalEvents;
  }
  
  this.lastActivity = new Date();
  return this.save();
};

// Mark as active
webhookSubscriptionSchema.methods.activate = function() {
  this.status = 'active';
  this.lastActivity = new Date();
  return this.save();
};

// Mark as inactive
webhookSubscriptionSchema.methods.deactivate = function() {
  this.status = 'inactive';
  this.lastActivity = new Date();
  return this.save();
};

// Mark as error
webhookSubscriptionSchema.methods.markError = function(error) {
  this.status = 'error';
  this.lastError = error;
  this.errorCount += 1;
  this.lastActivity = new Date();
  return this.save();
};

// Get active subscriptions by account
webhookSubscriptionSchema.statics.getActiveByAccount = async function(instagramAccountId) {
  return this.findOne({
    instagramAccountId,
    status: 'active'
  });
};

// Get all active subscriptions
webhookSubscriptionSchema.statics.getAllActive = async function() {
  return this.find({ status: 'active' });
};

// Get subscriptions by user
webhookSubscriptionSchema.statics.getByUser = async function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('WebhookSubscription', webhookSubscriptionSchema);
