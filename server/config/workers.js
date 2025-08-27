const { Worker } = require('bullmq');
const { connection } = require('./redis');
const { 
  QUEUE_NAMES,
  instagramEventsQueue,
  automationProcessingQueue,
  delayedMessagesQueue,
  rateLimitedMessagesQueue
} = require('./queues');

// Worker concurrency settings
const WORKER_CONCURRENCY = {
  INSTAGRAM_EVENTS: 5,      // Process 5 Instagram events concurrently
  AUTOMATION_PROCESSING: 3,  // Process 3 automations concurrently
  DELAYED_MESSAGES: 10,      // Process 10 delayed messages concurrently
  RATE_LIMITED_MESSAGES: 2   // Process 2 rate-limited messages concurrently
};

// Create workers
const instagramEventsWorker = new Worker(QUEUE_NAMES.INSTAGRAM_EVENTS, async (job) => {
  console.log(`🔄 Processing Instagram event: ${job.id}`);
  
  try {
    const { eventData, userId } = job.data;
    
    // Process Instagram event (webhook data)
    const result = await processInstagramEvent(eventData, userId);
    
    // Add to automation processing queue if needed
    if (result.requiresAutomation) {
      await automationProcessingQueue.add('process-automation', {
        userId,
        eventData: result.processedData,
        timestamp: new Date().toISOString()
      }, {
        jobId: `automation-${job.id}`,
        delay: 1000 // 1 second delay
      });
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Instagram event processing failed: ${job.id}`, error);
    throw error; // Re-throw to trigger retry
  }
}, {
  connection,
  concurrency: WORKER_CONCURRENCY.INSTAGRAM_EVENTS,
  removeOnComplete: 100,
  removeOnFail: 50
});

const automationProcessingWorker = new Worker(QUEUE_NAMES.AUTOMATION_PROCESSING, async (job) => {
  console.log(`🔄 Processing automation: ${job.id}`);
  
  try {
    const { userId, eventData, timestamp } = job.data;
    
    // Process automation flow
    const result = await processAutomationFlow(userId, eventData);
    
    // Add delayed messages to queue if needed
    if (result.delayedMessages && result.delayedMessages.length > 0) {
      for (const delayedMsg of result.delayedMessages) {
        await delayedMessagesQueue.add('send-delayed-message', {
          userId,
          messageData: delayedMsg,
          originalEvent: eventData
        }, {
          jobId: `delayed-${job.id}-${delayedMsg.id}`,
          delay: delayedMsg.delayMs
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Automation processing failed: ${job.id}`, error);
    throw error;
  }
}, {
  connection,
  concurrency: WORKER_CONCURRENCY.AUTOMATION_PROCESSING,
  removeOnComplete: 100,
  removeOnFail: 50
});

const delayedMessagesWorker = new Worker(QUEUE_NAMES.DELAYED_MESSAGES, async (job) => {
  console.log(`🔄 Processing delayed message: ${job.id}`);
  
  try {
    const { userId, messageData, originalEvent } = job.data;
    
    // Send delayed message
    const result = await sendDelayedMessage(userId, messageData, originalEvent);
    
    return result;
  } catch (error) {
    console.error(`❌ Delayed message processing failed: ${job.id}`, error);
    throw error;
  }
}, {
  connection,
  concurrency: WORKER_CONCURRENCY.DELAYED_MESSAGES,
  removeOnComplete: 100,
  removeOnFail: 50
});

const rateLimitedMessagesWorker = new Worker(QUEUE_NAMES.RATE_LIMITED_MESSAGES, async (job) => {
  console.log(`🔄 Processing rate-limited message: ${job.id}`);
  
  try {
    const { userId, messageData } = job.data;
    
    // Check rate limits before sending
    const canSend = await checkRateLimits(userId);
    if (!canSend) {
      throw new Error('Rate limit exceeded');
    }
    
    // Send message
    const result = await sendRateLimitedMessage(userId, messageData);
    
    return result;
  } catch (error) {
    console.error(`❌ Rate-limited message processing failed: ${job.id}`, error);
    throw error;
  }
}, {
  connection,
  concurrency: WORKER_CONCURRENCY.RATE_LIMITED_MESSAGES,
  removeOnComplete: 200,
  removeOnFail: 100
});

// Worker event handlers
instagramEventsWorker.on('completed', (job) => {
  console.log(`✅ Instagram event worker completed: ${job.id}`);
});

instagramEventsWorker.on('failed', (job, err) => {
  console.error(`❌ Instagram event worker failed: ${job.id}`, err.message);
});

automationProcessingWorker.on('completed', (job) => {
  console.log(`✅ Automation worker completed: ${job.id}`);
});

automationProcessingWorker.on('failed', (job, err) => {
  console.error(`❌ Automation worker failed: ${job.id}`, err.message);
});

delayedMessagesWorker.on('completed', (job) => {
  console.log(`✅ Delayed message worker completed: ${job.id}`);
});

delayedMessagesWorker.on('failed', (job, err) => {
  console.error(`❌ Delayed message worker failed: ${job.id}`, err.message);
});

rateLimitedMessagesWorker.on('completed', (job) => {
  console.log(`✅ Rate-limited message worker completed: ${job.id}`);
});

rateLimitedMessagesWorker.on('failed', (job, err) => {
  console.error(`❌ Rate-limited message worker failed: ${job.id}`, err.message);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down workers gracefully...');
  
  await instagramEventsWorker.close();
  await automationProcessingWorker.close();
  await delayedMessagesWorker.close();
  await rateLimitedMessagesWorker.close();
  
  console.log('✅ All workers closed');
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Placeholder functions (to be implemented)
async function processInstagramEvent(eventData, userId) {
  // TODO: Implement Instagram event processing
  return { requiresAutomation: true, processedData: eventData };
}

async function processAutomationFlow(userId, eventData) {
  // TODO: Implement automation flow processing
  return { delayedMessages: [] };
}

async function sendDelayedMessage(userId, messageData, originalEvent) {
  // TODO: Implement delayed message sending
  return { success: true };
}

async function checkRateLimits(userId) {
  // TODO: Implement rate limit checking
  return true;
}

async function sendRateLimitedMessage(userId, messageData) {
  // TODO: Implement rate-limited message sending
  return { success: true };
}

module.exports = {
  WORKER_CONCURRENCY,
  instagramEventsWorker,
  automationProcessingWorker,
  delayedMessagesWorker,
  rateLimitedMessagesWorker
};
