const FlowEngine = require('./flowEngine');
// const queueService = require('../services/queueService');
// const rateLimitService = require('../services/rateLimitService');
const { v4: uuidv4 } = require('uuid');

class EnhancedFlowEngine extends FlowEngine {
  constructor() {
    super();
    // this.queueService = queueService;
    // this.rateLimitService = rateLimitService;
  }

  /**
   * Run automation with queue integration
   */
  async runAutomationWithQueue(userId, incomingMessage, flowId = null) {
    try {
      console.log(`🔄 Running automation with queue for user ${userId}`);
      
      // Get user's flow if not provided
      if (!flowId) {
        const user = await this.getUser(userId);
        if (!user || !user.activeFlow) {
          throw new Error('No active flow found for user');
        }
        flowId = user.activeFlow;
      }

      // Check rate limits before processing
      const rateLimitCheck = await this.rateLimitService.canSendMessage(userId, 'default');
      if (!rateLimitCheck.canSend) {
        console.log(`⏳ Rate limit exceeded for user ${userId}: ${rateLimitCheck.reason}`);
        
        // Queue the automation for later processing
        await this.queueService.addAutomationJob(userId, incomingMessage, flowId, {
          delay: this._calculateDelay(rateLimitCheck),
          metadata: {
            reason: 'rate_limited',
            originalTimestamp: new Date().toISOString()
          }
        });
        
        return {
          success: false,
          reason: 'Rate limited',
          queued: true,
          resetTime: rateLimitCheck.resetTime
        };
      }

      // Process the automation
      const result = await this.runAutomation(userId, incomingMessage);
      
      // Increment rate limit counter
      await this.rateLimitService.incrementMessageCount(userId, 'default');
      
      // Handle delayed messages from the flow
      if (result.delayedMessages && result.delayedMessages.length > 0) {
        await this._queueDelayedMessages(userId, result.delayedMessages, incomingMessage);
      }
      
      return {
        success: true,
        result,
        processed: true
      };
      
    } catch (error) {
      console.error(`❌ Error running automation with queue: ${error.message}`);
      
      // Queue for retry if it's a recoverable error
      if (this._isRecoverableError(error)) {
        await this.queueService.addAutomationJob(userId, incomingMessage, flowId, {
          delay: 5000, // 5 second delay
          attempts: 3,
          metadata: {
            reason: 'retry',
            error: error.message,
            originalTimestamp: new Date().toISOString()
          }
        });
        
        return {
          success: false,
          reason: 'Queued for retry',
          queued: true,
          error: error.message
        };
      }
      
      throw error;
    }
  }

  /**
   * Process automation from queue
   */
  async processAutomationFromQueue(userId, eventData, flowId) {
    try {
      console.log(`🔄 Processing automation from queue for user ${userId}`);
      
      // Run the automation
      const result = await this.runAutomation(userId, eventData);
      
      // Handle delayed messages
      if (result.delayedMessages && result.delayedMessages.length > 0) {
        await this._queueDelayedMessages(userId, result.delayedMessages, eventData);
      }
      
      // Mark job as completed
      this.queueService.markJobCompleted(`automation-${userId}-${flowId}`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error processing automation from queue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send delayed message from queue
   */
  async sendDelayedMessageFromQueue(userId, messageData, originalEvent) {
    try {
      console.log(`🔄 Sending delayed message from queue for user ${userId}`);
      
      // Check rate limits
      const rateLimitCheck = await this.rateLimitService.canSendMessage(userId, 'default');
      if (!rateLimitCheck.canSend) {
        console.log(`⏳ Rate limit exceeded for delayed message, user ${userId}`);
        
        // Re-queue with longer delay
        const newDelay = this._calculateDelay(rateLimitCheck);
        await this.queueService.addDelayedMessage(userId, messageData, newDelay, {
          originalEvent,
          metadata: {
            reason: 'rate_limited_retry',
            originalTimestamp: messageData.timestamp
          }
        });
        
        return {
          success: false,
          reason: 'Rate limited, re-queued',
          reQueued: true
        };
      }
      
      // Send the message
      const result = await this._sendMessage(userId, messageData);
      
      // Increment rate limit counter
      await this.rateLimitService.incrementMessageCount(userId, 'default');
      
      return {
        success: true,
        result
      };
      
    } catch (error) {
      console.error(`❌ Error sending delayed message from queue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Queue delayed messages from flow execution
   */
  async _queueDelayedMessages(userId, delayedMessages, originalEvent) {
    try {
      for (const message of delayedMessages) {
        const delayMs = message.delay || 0;
        
        await this.queueService.addDelayedMessage(userId, message, delayMs, {
          originalEvent,
          metadata: {
            source: 'flow_execution',
            nodeId: message.nodeId,
            flowId: message.flowId
          }
        });
      }
      
      console.log(`✅ Queued ${delayedMessages.length} delayed messages for user ${userId}`);
      
    } catch (error) {
      console.error(`❌ Error queuing delayed messages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate delay based on rate limit reset time
   */
  _calculateDelay(rateLimitCheck) {
    if (!rateLimitCheck.resetTime) {
      return 60000; // Default 1 minute delay
    }
    
    const now = new Date();
    const resetTime = new Date(rateLimitCheck.resetTime);
    const delayMs = Math.max(0, resetTime.getTime() - now.getTime());
    
    // Add some buffer time
    return delayMs + 5000; // 5 second buffer
  }

  /**
   * Check if error is recoverable and should be retried
   */
  _isRecoverableError(error) {
    const recoverableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'RATE_LIMIT_EXCEEDED',
      'SERVICE_UNAVAILABLE'
    ];
    
    return recoverableErrors.some(errType => 
      error.message.includes(errType) || 
      error.code === errType
    );
  }

  /**
   * Send message with rate limiting
   */
  async _sendMessage(userId, messageData) {
    try {
      // Check rate limits
      const rateLimitCheck = await this.rateLimitService.canSendMessage(userId, 'default');
      if (!rateLimitCheck.canSend) {
        throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
      }
      
      // TODO: Implement actual message sending via Meta API
      console.log(`📤 Sending message for user ${userId}:`, messageData);
      
      // Simulate message sending
      const result = {
        messageId: uuidv4(),
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      // Increment rate limit counter
      await this.rateLimitService.incrementMessageCount(userId, 'default');
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error sending message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user with active flow
   */
  async getUser(userId) {
    try {
      // TODO: Implement user fetching from database
      // This is a placeholder - replace with actual database call
      return {
        id: userId,
        activeFlow: 'default-flow-id'
      };
    } catch (error) {
      console.error(`❌ Error getting user: ${error.message}`);
      return null;
    }
  }

  /**
   * Get flow execution statistics
   */
  async getFlowStats(userId) {
    try {
      const stats = await this.queueService.getQueueStats();
      
      return {
        userId,
        timestamp: new Date().toISOString(),
        queues: stats,
        rateLimits: await this.rateLimitService.getRateLimitStatus(userId, 'default')
      };
      
    } catch (error) {
      console.error(`❌ Error getting flow stats: ${error.message}`);
      return null;
    }
  }

  /**
   * Clean up old jobs and data
   */
  async cleanup() {
    try {
      console.log('🧹 Cleaning up enhanced flow engine...');
      
      // Clean up expired rate limit keys
      await this.rateLimitService.cleanupExpiredKeys();
      
      console.log('✅ Enhanced flow engine cleanup completed');
      
    } catch (error) {
      console.error(`❌ Error during cleanup: ${error.message}`);
    }
  }
}

module.exports = EnhancedFlowEngine;
