/**
 * Redis Cache Service
 * Handles caching operations for performance optimization
 */

const Redis = require('ioredis');
const config = require('../config');
const { logger } = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  /**
   * Initialize Redis client
   */
  async init() {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error', error);
      });

      await this.client.ping();
    } catch (error) {
      logger.error('Failed to initialize Redis', error);
      this.isConnected = false;
    }
  }

  /**
   * Set cache
   */
  async set(key, value, ttl = 3600) {
    try {
      if (!this.isConnected) return false;

      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error('Cache set error', error);
      return false;
    }
  }

  /**
   * Get cache
   */
  async get(key) {
    try {
      if (!this.isConnected) return null;

      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value);
    } catch (error) {
      logger.error('Cache get error', error);
      return null;
    }
  }

  /**
   * Delete cache
   */
  async del(key) {
    try {
      if (!this.isConnected) return false;

      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern) {
    try {
      if (!this.isConnected) return false;

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache pattern delete error', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      if (!this.isConnected) return false;

      return await this.client.exists(key) === 1;
    } catch (error) {
      logger.error('Cache exists error', error);
      return false;
    }
  }

  /**
   * Set cache with automatic expiration
   */
  async setWithExpire(key, value, ttl) {
    return await this.set(key, value, ttl);
  }

  /**
   * Get or set cache (cache aside pattern)
   */
  async getOrSet(key, fetchFunction, ttl = 3600) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Fetch from source
      const value = await fetchFunction();

      // Set in cache
      await this.set(key, value, ttl);

      return value;
    } catch (error) {
      logger.error('Cache getOrSet error', error);
      // Return fresh data if cache fails
      return await fetchFunction();
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern) {
    return await this.delPattern(pattern);
  }

  /**
   * Flush all cache
   */
  async flush() {
    try {
      if (!this.isConnected) return false;

      await this.client.flushdb();
      logger.info('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      if (!this.isConnected) {
        return { connected: false };
      }

      const info = await this.client.info('stats');
      const dbSize = await this.client.dbsize();

      return {
        connected: true,
        dbSize,
        info,
      };
    } catch (error) {
      logger.error('Cache stats error', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
