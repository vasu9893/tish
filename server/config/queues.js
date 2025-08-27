const { Queue, Worker, QueueScheduler } = require('bullmq');
const { connection } = require('./redis');

// Queue names
const QUEUE_NAMES = {
  INSTAGRAM_EVENTS: 'instagram-events',
  AUTOMATION_PROCESSING: 'automation-processing',
  DELAYED_MESSAGES: 'delayed-messages',
  RATE_LIMITED_MESSAGES: 'rate-limited-messages'
};

// Default job options
const DEFAULT_JOB_OPTS = {
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50,      // Keep last 50 failed jobs
  attempts: 3,            // Retry failed jobs 3 times
  backoff: {
    type: 'exponential',
    delay: 2000          // Start with 2s delay
  }
};

// Rate limiting configuration per Instagram account
const RATE_LIMITS = {
  MESSAGES_PER_MINUTE: 20,
  MESSAGES_PER_HOUR: 100,
  MESSAGES_PER_DAY: 1000
};

// Create queues
const instagramEventsQueue = new Queue(QUEUE_NAMES.INSTAGRAM_EVENTS, {
  connection,
  defaultJobOptions: DEFAULT_JOB_OPTS
});

const automationProcessingQueue = new Queue(QUEUE_NAMES.AUTOMATION_PROCESSING, {
  connection,
  defaultJobOptions: {
    ...DEFAULT_JOB_OPTS,
    attempts: 5, // More retries for automation processing
    backoff: {
      type: 'exponential',
      delay: 5000 // Start with 5s delay
    }
  }
});

const delayedMessagesQueue = new Queue(QUEUE_NAMES.DELAYED_MESSAGES, {
  connection,
  defaultJobOptions: {
    ...DEFAULT_JOB_OPTS,
    attempts: 2, // Fewer retries for delayed messages
    removeOnComplete: 50
  }
});

const rateLimitedMessagesQueue = new Queue(QUEUE_NAMES.RATE_LIMITED_MESSAGES, {
  connection,
  defaultJobOptions: {
    ...DEFAULT_JOB_OPTS,
    attempts: 1, // No retries for rate-limited messages
    removeOnComplete: 200
  }
});

// Create schedulers for delayed jobs
const delayedMessagesScheduler = new QueueScheduler(QUEUE_NAMES.DELAYED_MESSAGES, {
  connection
});

// Queue event handlers
instagramEventsQueue.on('completed', (job) => {
  console.log(`✅ Instagram event processed: ${job.id}`);
});

instagramEventsQueue.on('failed', (job, err) => {
  console.error(`❌ Instagram event failed: ${job.id}`, err.message);
});

automationProcessingQueue.on('completed', (job) => {
  console.log(`✅ Automation processed: ${job.id}`);
});

automationProcessingQueue.on('failed', (job, err) => {
  console.error(`❌ Automation failed: ${job.id}`, err.message);
});

delayedMessagesQueue.on('completed', (job) => {
  console.log(`✅ Delayed message sent: ${job.id}`);
});

delayedMessagesQueue.on('failed', (job, err) => {
  console.error(`❌ Delayed message failed: ${job.id}`, err.message);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down queues gracefully...');
  
  await instagramEventsQueue.close();
  await automationProcessingQueue.close();
  await delayedMessagesQueue.close();
  await rateLimitedMessagesQueue.close();
  await delayedMessagesScheduler.close();
  
  console.log('✅ All queues closed');
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = {
  QUEUE_NAMES,
  RATE_LIMITS,
  DEFAULT_JOB_OPTS,
  instagramEventsQueue,
  automationProcessingQueue,
  delayedMessagesQueue,
  rateLimitedMessagesQueue,
  delayedMessagesScheduler
};
