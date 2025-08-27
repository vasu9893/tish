const Redis = require('ioredis');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  showFriendlyErrorStack: process.env.NODE_ENV === 'development'
};

// Create Redis client connection (for queue operations)
const client = new Redis(redisConfig);

// Create Redis subscriber connection (for worker operations)
const subscriber = new Redis(redisConfig);

// Handle connection events
client.on('connect', () => {
  console.log('✅ Redis client connected');
});

client.on('error', (err) => {
  console.error('❌ Redis client error:', err);
});

subscriber.on('connect', () => {
  console.log('✅ Redis subscriber connected');
});

subscriber.on('error', (err) => {
  console.error('❌ Redis subscriber error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down Redis connections...');
  await client.quit();
  await subscriber.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down Redis connections...');
  await client.quit();
  await subscriber.quit();
  process.exit(0);
});

module.exports = {
  connection: {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db
  },
  client,
  subscriber
};
