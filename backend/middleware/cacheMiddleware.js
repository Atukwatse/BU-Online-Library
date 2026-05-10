/**
 * Caching Middleware
 * Provides caching capabilities for API responses
 */

const cacheService = require('../services/cacheService');
const { performance: logPerformance } = require('../utils/logger');

/**
 * Cache response middleware
 */
const cacheResponse = (keyPrefix, ttl = 3600) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = `${keyPrefix}:${req.originalUrl}:${JSON.stringify(req.query)}`;

    try {
      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        logPerformance('cache_hit', 0, { cacheKey });
        return res.status(200).json(cached);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json to cache response
      res.json = function(data) {
        // Cache successful responses
        if (res.statusCode === 200) {
          cacheService.set(cacheKey, data, ttl).catch(err => {
            console.error('Cache set error:', err);
          });
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Invalidate cache middleware
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Invalidate cache on successful write operations
      if (res.statusCode < 400) {
        cacheService.invalidatePattern(pattern).catch(err => {
          console.error('Cache invalidate error:', err);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Cache key generator
 */
const generateCacheKey = (prefix, params = {}) => {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':');
  
  return paramString ? `${prefix}:${paramString}` : prefix;
};

/**
 * Cache books middleware
 */
const cacheBooks = (ttl = 3600) => {
  return cacheResponse('books', ttl);
};

/**
 * Cache book details middleware
 */
const cacheBookDetails = (ttl = 3600) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cacheKey = `book:${req.params.id}`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return res.status(200).json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (res.statusCode === 200) {
        cacheService.set(cacheKey, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Cache user data middleware
 */
const cacheUserData = (ttl = 1800) => {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.user) return next();

    const cacheKey = `user:${req.user.id}`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return res.status(200).json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (res.statusCode === 200) {
        cacheService.set(cacheKey, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Invalidate books cache
 */
const invalidateBooksCache = () => {
  return invalidateCache('books:*');
};

/**
 * Invalidate book details cache
 */
const invalidateBookCache = () => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (res.statusCode < 400 && req.params.id) {
        cacheService.del(`book:${req.params.id}`);
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Invalidate user cache
 */
const invalidateUserCache = () => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (res.statusCode < 400 && req.user) {
        cacheService.del(`user:${req.user.id}`);
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  cacheResponse,
  invalidateCache,
  generateCacheKey,
  cacheBooks,
  cacheBookDetails,
  cacheUserData,
  invalidateBooksCache,
  invalidateBookCache,
  invalidateUserCache,
};
