const { client: redisClient } = require('../config/redis');
const { RATE_LIMITS } = require('../config/queues');

class RateLimitService {
  constructor() {
    this.redisClient = redisClient;
  }

  /**
   * Generate Redis key for rate limiting
   */
  _getRateLimitKey(userId, accountId, timeUnit) {
    const now = new Date();
    let key;
    
    switch (timeUnit) {
      case 'minute':
        key = `rate_limit:${userId}:${accountId}:minute:${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
        break;
      case 'hour':
        key = `rate_limit:${userId}:${accountId}:hour:${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
        break;
      case 'day':
        key = `rate_limit:${userId}:${accountId}:day:${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        break;
      default:
        throw new Error(`Invalid time unit: ${timeUnit}`);
    }
    
    return key;
  }

  /**
   * Check if user can send message based on rate limits
   */
  async canSendMessage(userId, accountId) {
    try {
      const minuteKey = this._getRateLimitKey(userId, accountId, 'minute');
      const hourKey = this._getRateLimitKey(userId, accountId, 'hour');
      const dayKey = this._getRateLimitKey(userId, accountId, 'day');

      // Get current counts
      const [minuteCount, hourCount, dayCount] = await Promise.all([
        this.redisClient.get(minuteKey) || 0,
        this.redisClient.get(hourKey) || 0,
        this.redisClient.get(dayKey) || 0
      ]);

      const minuteLimit = parseInt(minuteCount);
      const hourLimit = parseInt(hourCount);
      const dayLimit = parseInt(dayCount);

      // Check if any limit is exceeded
      if (minuteLimit >= RATE_LIMITS.MESSAGES_PER_MINUTE) {
        return {
          canSend: false,
          reason: 'Minute rate limit exceeded',
          limit: RATE_LIMITS.MESSAGES_PER_MINUTE,
          current: minuteLimit,
          resetTime: this._getResetTime('minute')
        };
      }

      if (hourLimit >= RATE_LIMITS.MESSAGES_PER_HOUR) {
        return {
          canSend: false,
          reason: 'Hour rate limit exceeded',
          limit: RATE_LIMITS.MESSAGES_PER_HOUR,
          current: hourLimit,
          resetTime: this._getResetTime('hour')
        };
      }

      if (dayLimit >= RATE_LIMITS.MESSAGES_PER_DAY) {
        return {
          canSend: false,
          reason: 'Day rate limit exceeded',
          limit: RATE_LIMITS.MESSAGES_PER_DAY,
          current: dayLimit,
          resetTime: this._getResetTime('day')
        };
      }

      return {
        canSend: true,
        limits: {
          minute: { current: minuteLimit, limit: RATE_LIMITS.MESSAGES_PER_MINUTE },
          hour: { current: hourLimit, limit: RATE_LIMITS.MESSAGES_PER_HOUR },
          day: { current: dayLimit, limit: RATE_LIMITS.MESSAGES_PER_DAY }
        }
      };

    } catch (error) {
      console.error('❌ Error checking rate limits:', error);
      // Default to allowing if rate limit check fails
      return { canSend: true, error: 'Rate limit check failed' };
    }
  }

  /**
   * Increment message count for rate limiting
   */
  async incrementMessageCount(userId, accountId) {
    try {
      const minuteKey = this._getRateLimitKey(userId, accountId, 'minute');
      const hourKey = this._getRateLimitKey(userId, accountId, 'hour');
      const dayKey = this._getRateLimitKey(userId, accountId, 'day');

      // Set expiration times
      const minuteExpiry = 60; // 1 minute
      const hourExpiry = 60 * 60; // 1 hour
      const dayExpiry = 24 * 60 * 60; // 1 day

      // Increment counts with expiration
      await Promise.all([
        this.redisClient.multi()
          .incr(minuteKey)
          .expire(minuteKey, minuteExpiry)
          .exec(),
        this.redisClient.multi()
          .incr(hourKey)
          .expire(hourKey, hourExpiry)
          .exec(),
        this.redisClient.multi()
          .incr(dayKey)
          .expire(dayKey, dayExpiry)
          .exec()
      ]);

      console.log(`📊 Rate limit incremented for user ${userId}, account ${accountId}`);
      return true;

    } catch (error) {
      console.error('❌ Error incrementing rate limit:', error);
      return false;
    }
  }

  /**
   * Get reset time for rate limit window
   */
  _getResetTime(timeUnit) {
    const now = new Date();
    
    switch (timeUnit) {
      case 'minute':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);
      case 'hour':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      default:
        return now;
    }
  }

  /**
   * Get current rate limit status for user
   */
  async getRateLimitStatus(userId, accountId) {
    try {
      const minuteKey = this._getRateLimitKey(userId, accountId, 'minute');
      const hourKey = this._getRateLimitKey(userId, accountId, 'hour');
      const dayKey = this._getRateLimitKey(userId, accountId, 'day');

      // Get current counts and TTL
      const [minuteCount, hourCount, dayCount, minuteTTL, hourTTL, dayTTL] = await Promise.all([
        this.redisClient.get(minuteKey) || 0,
        this.redisClient.get(hourKey) || 0,
        this.redisClient.get(dayKey) || 0,
        this.redisClient.ttl(minuteKey),
        this.redisClient.ttl(hourKey),
        this.redisClient.ttl(dayKey)
      ]);

      return {
        minute: {
          current: parseInt(minuteCount),
          limit: RATE_LIMITS.MESSAGES_PER_MINUTE,
          remaining: Math.max(0, RATE_LIMITS.MESSAGES_PER_MINUTE - parseInt(minuteCount)),
          resetIn: Math.max(0, minuteTTL)
        },
        hour: {
          current: parseInt(hourCount),
          limit: RATE_LIMITS.MESSAGES_PER_HOUR,
          remaining: Math.max(0, RATE_LIMITS.MESSAGES_PER_HOUR - parseInt(hourCount)),
          resetIn: Math.max(0, hourTTL)
        },
        day: {
          current: parseInt(dayCount),
          limit: RATE_LIMITS.MESSAGES_PER_DAY,
          remaining: Math.max(0, RATE_LIMITS.MESSAGES_PER_DAY - parseInt(dayCount)),
          resetIn: Math.max(0, dayTTL)
        }
      };

    } catch (error) {
      console.error('❌ Error getting rate limit status:', error);
      return null;
    }
  }

  /**
   * Reset rate limits for user (admin function)
   */
  async resetRateLimits(userId, accountId) {
    try {
      const minuteKey = this._getRateLimitKey(userId, accountId, 'minute');
      const hourKey = this._getRateLimitKey(userId, accountId, 'hour');
      const dayKey = this._getRateLimitKey(userId, accountId, 'day');

      await Promise.all([
        this.redisClient.del(minuteKey),
        this.redisClient.del(hourKey),
        this.redisClient.del(dayKey)
      ]);

      console.log(`🔄 Rate limits reset for user ${userId}, account ${accountId}`);
      return true;

    } catch (error) {
      console.error('❌ Error resetting rate limits:', error);
      return false;
    }
  }

  /**
   * Get all rate limit keys for monitoring
   */
  async getAllRateLimitKeys() {
    try {
      const keys = await this.redisClient.keys('rate_limit:*');
      return keys;
    } catch (error) {
      console.error('❌ Error getting rate limit keys:', error);
      return [];
    }
  }

  /**
   * Clean up expired rate limit keys
   */
  async cleanupExpiredKeys() {
    try {
      const keys = await this.getAllRateLimitKeys();
      let cleanedCount = 0;

      for (const key of keys) {
        const ttl = await this.redisClient.ttl(key);
        if (ttl === -1) { // No expiration set
          await this.redisClient.del(key);
          cleanedCount++;
        }
      }

      console.log(`🧹 Cleaned up ${cleanedCount} expired rate limit keys`);
      return cleanedCount;

    } catch (error) {
      console.error('❌ Error cleaning up expired keys:', error);
      return 0;
    }
  }
}

module.exports = new RateLimitService();
