# Redis Configuration for InstantChat Queue System

## Environment Variables

Add these variables to your `.env` file to configure the Redis-based queue system:

```bash
# Redis Configuration (for BullMQ queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Queue Configuration
QUEUE_CONCURRENCY_INSTAGRAM_EVENTS=5
QUEUE_CONCURRENCY_AUTOMATION_PROCESSING=3
QUEUE_CONCURRENCY_DELAYED_MESSAGES=10
QUEUE_CONCURRENCY_RATE_LIMITED_MESSAGES=2

# Rate Limiting
RATE_LIMIT_MESSAGES_PER_MINUTE=20
RATE_LIMIT_MESSAGES_PER_HOUR=100
RATE_LIMIT_MESSAGES_PER_DAY=1000
```

## Redis Setup Options

### Option 1: Local Redis (Development)
```bash
# Install Redis on macOS
brew install redis

# Install Redis on Ubuntu/Debian
sudo apt-get install redis-server

# Start Redis
redis-server
```

### Option 2: Docker Redis (Recommended for Development)
```bash
# Run Redis container
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Or use docker-compose (see docker-compose.yml)
docker-compose up -d redis
```

### Option 3: Redis Cloud (Production)
- [Redis Cloud](https://redis.com/try-free/)
- [Upstash Redis](https://upstash.com/)
- [AWS ElastiCache](https://aws.amazon.com/elasticache/)

## Configuration Details

### REDIS_HOST
- **Default**: `localhost`
- **Description**: Redis server hostname or IP address
- **Production**: Use your Redis cloud service hostname

### REDIS_PORT
- **Default**: `6379`
- **Description**: Redis server port
- **Note**: Standard Redis port, change if using custom configuration

### REDIS_PASSWORD
- **Default**: Empty (no password)
- **Description**: Redis authentication password
- **Production**: Always set a strong password

### REDIS_DB
- **Default**: `0`
- **Description**: Redis database number (0-15)
- **Note**: BullMQ will create additional keys in this database

## Queue Concurrency Settings

### QUEUE_CONCURRENCY_INSTAGRAM_EVENTS
- **Default**: `5`
- **Description**: Number of Instagram events processed concurrently
- **Adjustment**: Increase for high-volume Instagram accounts

### QUEUE_CONCURRENCY_AUTOMATION_PROCESSING
- **Default**: `3`
- **Description**: Number of automation flows processed concurrently
- **Adjustment**: Increase for complex automation workflows

### QUEUE_CONCURRENCY_DELAYED_MESSAGES
- **Default**: `10`
- **Description**: Number of delayed messages processed concurrently
- **Adjustment**: Increase for high-frequency delayed messaging

### QUEUE_CONCURRENCY_RATE_LIMITED_MESSAGES
- **Default**: `2`
- **Description**: Number of rate-limited messages processed concurrently
- **Adjustment**: Keep low to respect API rate limits

## Rate Limiting Configuration

### RATE_LIMIT_MESSAGES_PER_MINUTE
- **Default**: `20`
- **Description**: Maximum messages per minute per Instagram account
- **Meta API Limit**: 20 messages per minute

### RATE_LIMIT_MESSAGES_PER_HOUR
- **Default**: `100`
- **Description**: Maximum messages per hour per Instagram account
- **Meta API Limit**: 100 messages per hour

### RATE_LIMIT_MESSAGES_PER_DAY
- **Default**: `1000`
- **Description**: Maximum messages per day per Instagram account
- **Meta API Limit**: 1000 messages per day

## Health Check

Monitor your Redis connection:

```bash
# Check Redis connection
curl http://localhost:5000/api/health/queues

# View queue dashboard
http://localhost:5000/admin/queues
```

## Troubleshooting

### Connection Issues
```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
docker logs redis

# Verify environment variables
echo $REDIS_HOST
echo $REDIS_PORT
```

### Performance Issues
- Increase concurrency settings for high-volume scenarios
- Monitor Redis memory usage
- Use Redis persistence for critical data
- Consider Redis clustering for production

### Security
- Always use Redis password in production
- Restrict Redis access to application servers only
- Use Redis SSL/TLS in production
- Regular security updates
