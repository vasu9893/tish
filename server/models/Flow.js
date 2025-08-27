const mongoose = require('mongoose')

const FlowSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  flowJson: {
    type: Object,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound index for userId + name to ensure unique flows per user
FlowSchema.index({ userId: 1, name: 1 }, { unique: true })

// Virtual for flow statistics
FlowSchema.virtual('nodeCount').get(function() {
  return this.flowJson?.nodes?.length || 0
})

FlowSchema.virtual('edgeCount').get(function() {
  return this.flowJson?.edges?.length || 0
})

// Method to get flow summary
FlowSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    isActive: this.isActive,
    nodeCount: this.nodeCount,
    edgeCount: this.edgeCount,
    tags: this.tags,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  }
}

// Static method to find flows by user
FlowSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ updatedAt: -1 })
}

// Static method to find active flows by user
FlowSchema.statics.findActiveByUser = function(userId) {
  return this.find({ userId, isActive: true }).sort({ updatedAt: -1 })
}

module.exports = mongoose.model('Flow', FlowSchema)
