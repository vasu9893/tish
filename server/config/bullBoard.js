const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { 
  instagramEventsQueue,
  automationProcessingQueue,
  delayedMessagesQueue,
  rateLimitedMessagesQueue
} = require('./queues');

// Create Express adapter for Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Create Bull Board with all queues
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullMQAdapter(instagramEventsQueue),
    new BullMQAdapter(automationProcessingQueue),
    new BullMQAdapter(delayedMessagesQueue),
    new BullMQAdapter(rateLimitedMessagesQueue)
  ],
  serverAdapter: serverAdapter
});

// Add queue monitoring
const addQueueMonitoring = (queue, queueName) => {
  queue.on('waiting', (job) => {
    console.log(`⏳ Job ${job.id} waiting in ${queueName}`);
  });
  
  queue.on('active', (job) => {
    console.log(`🔄 Job ${job.id} active in ${queueName}`);
  });
  
  queue.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed in ${queueName}`);
  });
  
  queue.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed in ${queueName}:`, err.message);
  });
  
  queue.on('stalled', (job) => {
    console.warn(`⚠️ Job ${job.id} stalled in ${queueName}`);
  });
  
  queue.on('progress', (job, progress) => {
    console.log(`📊 Job ${job.id} progress in ${queueName}: ${progress}%`);
  });
};

// Add monitoring to all queues
addQueueMonitoring(instagramEventsQueue, 'Instagram Events');
addQueueMonitoring(automationProcessingQueue, 'Automation Processing');
addQueueMonitoring(delayedMessagesQueue, 'Delayed Messages');
addQueueMonitoring(rateLimitedMessagesQueue, 'Rate Limited Messages');

// Queue statistics helper
const getQueueStats = async () => {
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
    return null;
  }
};

// Health check helper
const checkQueueHealth = async () => {
  try {
    const stats = await getQueueStats();
    if (!stats) return false;
    
    // Check if any queue has excessive failed jobs
    const totalFailed = Object.values(stats).reduce((sum, queue) => {
      return sum + (queue.failed ? queue.failed.length : 0);
    }, 0);
    
    // Check if any queue has excessive waiting jobs
    const totalWaiting = Object.values(stats).reduce((sum, queue) => {
      return sum + (queue.waiting ? queue.waiting.length : 0);
    }, 0);
    
    // Health thresholds
    const isHealthy = totalFailed < 100 && totalWaiting < 1000;
    
    return {
      healthy: isHealthy,
      stats,
      totalFailed,
      totalWaiting,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error checking queue health:', error);
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Clean up old jobs helper
const cleanupOldJobs = async () => {
  try {
    console.log('🧹 Cleaning up old jobs...');
    
    // Clean up completed jobs older than 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    await instagramEventsQueue.clean(oneDayAgo, 'completed');
    await automationProcessingQueue.clean(oneDayAgo, 'completed');
    await delayedMessagesQueue.clean(oneDayAgo, 'completed');
    await rateLimitedMessagesQueue.clean(oneDayAgo, 'completed');
    
    // Clean up failed jobs older than 7 days
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    await instagramEventsQueue.clean(oneWeekAgo, 'failed');
    await automationProcessingQueue.clean(oneWeekAgo, 'failed');
    await delayedMessagesQueue.clean(oneWeekAgo, 'failed');
    await rateLimitedMessagesQueue.clean(oneWeekAgo, 'failed');
    
    console.log('✅ Old jobs cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up old jobs:', error);
  }
};

// Schedule cleanup every hour
setInterval(cleanupOldJobs, 60 * 60 * 1000);

module.exports = {
  serverAdapter,
  addQueue,
  removeQueue,
  setQueues,
  replaceQueues,
  getQueueStats,
  checkQueueHealth,
  cleanupOldJobs
};
