const mongoose = require('mongoose')

const instagramUserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  instagramAccountId: {
    type: String,
    required: true
  },
  pageId: {
    type: String,
    required: true
  },
  pageAccessToken: {
    type: String,
    required: true
  },
  longLivedToken: {
    type: String,
    required: true
  },
  userAccessToken: {
    type: String,
    required: false // Optional, for future use
  },
  tokenExpiresAt: {
    type: Date,
    required: true
  },
  isConnected: {
    type: Boolean,
    default: true
  },
  lastConnected: {
    type: Date,
    default: Date.now
  },
  pageName: String,
  instagramUsername: String,
  permissions: [String],
  webhookSubscribed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Index for quick lookups
instagramUserSchema.index({ userId: 1 })
instagramUserSchema.index({ instagramAccountId: 1 })
instagramUserSchema.index({ pageId: 1 })

// Method to check if token is expired
instagramUserSchema.methods.isTokenExpired = function() {
  return new Date() > this.tokenExpiresAt
}

// Method to get days until token expires
instagramUserSchema.methods.daysUntilExpiry = function() {
  const now = new Date()
  const diffTime = this.tokenExpiresAt - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

module.exports = mongoose.model('InstagramUser', instagramUserSchema)
