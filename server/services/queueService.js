const { v4: uuidv4 } = require('uuid');
const { 
  instagramEventsQueue,
  automationProcessingQueue,
  delayedMessagesQueue,
  rateLimitedMessagesQueue,
  QUEUE_NAMES
} = require('../config/queues');

class QueueService {
  constructor() {
    this.processingJobs = new Set(); // Track currently processing jobs
  }

  /**
   * Add Instagram event to processing queue with idempotency
   */
  async addInstagramEvent(userId, eventData, options = {}) {
    try {
      // Generate unique job ID for idempotency
      const jobId = options.jobId || `instagram-${userId}-${eventData.messageId || uuidv4()}`;
      
      // Check if job is already processing
      if (this.processingJobs.has(jobId)) {
        console.log(`⏳ Job ${jobId} already processing, skipping...`);
        return { success: false, reason: 'Job already processing' };
      }

      // Add to queue
      const job = await instagramEventsQueue.add('process-instagram-event', {
        userId,
        eventData,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'webhook',
          eventType: eventData.object || 'message',
          ...options.metadata
        }
      }, {
        jobId,
        priority: options.priority || 0,
        delay: options.delay || 0,
        attempts: options.attempts || 3,
        backoff: options.backoff || {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: options.removeOnComplete || 100,
        removeOnFail: options.removeOnFail || 50
      });

      this.processingJobs.add(jobId);
      
      console.log(`✅ Instagram event queued: ${jobId}`);
      return { success: true, jobId: job.id, job };
      
    } catch (error) {
      console.error('❌ Error adding Instagram event to queue:', error);
      throw error;
    }
  }

  /**
   * Add automation processing job
   */
  async addAutomationJob(userId, eventData, flowId, options = {}) {
    try {
      const jobId = options.jobId || `automation-${userId}-${flowId}-${uuidv4()}`;
      
      const job = await automationProcessingQueue.add('process-automation', {
        userId,
        eventData,
        flowId,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'instagram-event',
          flowId,
          ...options.metadata
        }
      }, {
        jobId,
        priority: options.priority || 1,
        delay: options.delay || 0,
        attempts: options.attempts || 5,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: options.removeOnComplete || 100,
        removeOnFail: options.removeOnFail || 50
      });

      console.log(`✅ Automation job queued: ${jobId}`);
      return { success: true, jobId: job.id, job };
      
    } catch (error) {
      console.error('❌ Error adding automation job to queue:', error);
      throw error;
    }
  }

  /**
   * Add delayed message job
   */
  async addDelayedMessage(userId, messageData, delayMs, options = {}) {
    try {
      const jobId = options.jobId || `delayed-${userId}-${uuidv4()}`;
      
      const job = await delayedMessagesQueue.add('send-delayed-message', {
        userId,
        messageData,
        originalEvent: options.originalEvent,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'automation',
          messageType: 'delayed',
          ...options.metadata
        }
      }, {
        jobId,
        delay: delayMs,
        attempts: options.attempts || 2,
        backoff: {
          type: 'exponential',
          delay: 3000
        },
        removeOnComplete: options.removeOnComplete || 50,
        removeOnFail: options.removeOnFail || 25
      });

      console.log(`✅ Delayed message queued: ${jobId} (${delayMs}ms delay)`);
      return { success: true, jobId: job.id, job };
      
    } catch (error) {
      console.error('❌ Error adding delayed message to queue:', error);
      throw error;
    }
  }

  /**
   * Add rate-limited message job
   */
  async addRateLimitedMessage(userId, messageData, options = {}) {
    try {
      const jobId = options.jobId || `rate-limited-${userId}-${uuidv4()}`;
      
      const job = await rateLimitedMessagesQueue.add('send-rate-limited-message', {
        userId,
        messageData,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'user-action',
          messageType: 'rate-limited',
          ...options.metadata
        }
      }, {
        jobId,
        priority: options.priority || 0,
        attempts: options.attempts || 1,
        removeOnComplete: options.removeOnComplete || 200,
        removeOnFail: options.removeOnFail || 100
      });

      console.log(`✅ Rate-limited message queued: ${jobId}`);
      return { success: true, jobId: job.id, job };
      
    } catch (error) {
      console.error('❌ Error adding rate-limited message to queue:', error);
      throw error;
    }
  }

  /**
   * Remove job from processing set when completed
   */
  markJobCompleted(jobId) {
    this.processingJobs.delete(jobId);
  }

  /**
   * Get job status
   */
  async getJobStatus(queueName, jobId) {
    try {
      let queue;
      switch (queueName) {
        case QUEUE_NAMES.INSTAGRAM_EVENTS:
          queue = instagramEventsQueue;
          break;
        case QUEUE_NAMES.AUTOMATION_PROCESSING:
          queue = automationProcessingQueue;
          break;
        case QUEUE_NAMES.DELAYED_MESSAGES:
          queue = delayedMessagesQueue;
          break;
        case QUEUE_NAMES.RATE_LIMITED_MESSAGES:
          queue = rateLimitedMessagesQueue;
          break;
        default:
          throw new Error(`Unknown queue: ${queueName}`);
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        return { exists: false };
      }

      return {
        exists: true,
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress: job.progress(),
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        returnvalue: job.returnvalue
      };
      
    } catch (error) {
      console.error('❌ Error getting job status:', error);
      throw error;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(queueName, jobId) {
    try {
      let queue;
      switch (queueName) {
        case QUEUE_NAMES.INSTAGRAM_EVENTS:
          queue = instagramEventsQueue;
          break;
        case QUEUE_NAMES.AUTOMATION_PROCESSING:
          queue = automationProcessingQueue;
          break;
        case QUEUE_NAMES.DELAYED_MESSAGES:
          queue = delayedMessagesQueue;
          break;
        case QUEUE_NAMES.RATE_LIMITED_MESSAGES:
          queue = rateLimitedMessagesQueue;
          break;
        default:
          throw new Error(`Unknown queue: ${queueName}`);
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        return { success: false, reason: 'Job not found' };
      }

      if (job.isActive()) {
        await job.moveToFailed(new Error('Job cancelled by user'), '0');
      } else {
        await job.remove();
      }

      this.markJobCompleted(jobId);
      console.log(`✅ Job ${jobId} cancelled`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error cancelling job:', error);
      throw error;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName, jobId) {
    try {
      let queue;
      switch (queueName) {
        case QUEUE_NAMES.INSTAGRAM_EVENTS:
          queue = instagramEventsQueue;
          break;
        case QUEUE_NAMES.AUTOMATION_PROCESSING:
          queue = automationProcessingQueue;
          break;
        case QUEUE_NAMES.DELAYED_MESSAGES:
          queue = delayedMessagesQueue;
          break;
        case QUEUE_NAMES.RATE_LIMITED_MESSAGES:
          queue = rateLimitedMessagesQueue;
          break;
        default:
          throw new Error(`Unknown queue: ${queueName}`);
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        return { success: false, reason: 'Job not found' };
      }

      if (job.isFailed()) {
        await job.retry();
        console.log(`✅ Job ${jobId} retried`);
        return { success: true };
      } else {
        return { success: false, reason: 'Job is not in failed state' };
      }
      
    } catch (error) {
      console.error('❌ Error retrying job:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const stats = {
        instagramEvents: {
          waiting: await instagramEventsQueue.getWaiting(),
          active: await instagramEventsQueue.getActive(),
          completed: await instagramEventsQueue.getCompleted(),
          failed: await instagramEventsQueue.getFailed(),
          delayed: await instagramEventsQueue.getDelayed()
        },
        automationProcessing: {
          waiting: await automationProcessingQueue.getWaiting(),
          active: await automationProcessingQueue.getActive(),
          completed: await automationProcessingQueue.getCompleted(),
          failed: await automationProcessingQueue.getFailed(),
          delayed: await automationProcessingQueue.getDelayed()
        },
        delayedMessages: {
          waiting: await delayedMessagesQueue.getWaiting(),
          active: await delayedMessagesQueue.getActive(),
          completed: await delayedMessagesQueue.getCompleted(),
          failed: await delayedMessagesQueue.getFailed(),
          delayed: await delayedMessagesQueue.getDelayed()
        },
        rateLimitedMessages: {
          waiting: await rateLimitedMessagesQueue.getWaiting(),
          active: await rateLimitedMessagesQueue.getActive(),
          completed: await rateLimitedMessagesQueue.getCompleted(),
          failed: await rateLimitedMessagesQueue.getFailed(),
          delayed: await rateLimitedMessagesQueue.getDelayed()
        }
      };

      return stats;
      
    } catch (error) {
      console.error('❌ Error getting queue stats:', error);
      throw error;
    }
  }
}

module.exports = new QueueService();
