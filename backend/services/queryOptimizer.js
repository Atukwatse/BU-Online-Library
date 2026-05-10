/**
 * Query Optimization Service
 * Provides query optimization utilities
 */

const db = require('../config/mysql_database');
const cacheService = require('./cacheService');
const { performance: logPerformance } = require('../utils/logger');

class QueryOptimizer {
  /**
   * Execute query with caching
   */
  static async cachedQuery(sql, params, cacheKey, ttl = 3600) {
    try {
      // Try cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logPerformance('query_cache_hit', 0, { cacheKey });
        return cached;
      }

      // Execute query
      const startTime = Date.now();
      const result = await db.query(sql, params);
      const duration = Date.now() - startTime;

      // Cache result
      await cacheService.set(cacheKey, result, ttl);

      logPerformance('query_executed', duration, { cacheKey });

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Batch query execution with parallel processing
   */
  static async batchQuery(queries) {
    const startTime = Date.now();

    try {
      const results = await Promise.all(
        queries.map(q => db.query(q.sql, q.params))
      );

      logPerformance('batch_query', Date.now() - startTime, { queryCount: queries.length });

      return results;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lazy load related data
   */
  static async lazyLoad(loadFunction, cacheKey, ttl = 1800) {
    try {
      // Check cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Load data
      const startTime = Date.now();
      const data = await loadFunction();
      const duration = Date.now() - startTime;

      // Cache result
      await cacheService.set(cacheKey, data, ttl);

      logPerformance('lazy_load', duration, { cacheKey });

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Optimize SELECT query with only needed fields
   */
  static optimizeSelect(table, fields = ['*'], conditions = {}, options = {}) {
    const { limit, offset, orderBy, orderDir } = options;

    let sql = `SELECT ${fields.join(', ')} FROM ${table}`;
    const params = [];
    const whereClauses = [];

    // Build WHERE clause
    for (const [key, value] of Object.entries(conditions)) {
      whereClauses.push(`${key} = ?`);
      params.push(value);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Add ORDER BY
    if (orderBy) {
      sql += ` ORDER BY ${orderBy} ${orderDir || 'ASC'}`;
    }

    // Add LIMIT and OFFSET
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }

    if (offset) {
      sql += ' OFFSET ?';
      params.push(offset);
    }

    return { sql, params };
  }

  /**
   * Execute count query efficiently
   */
  static async count(table, conditions = {}) {
    const { sql, params } = this.optimizeSelect(table, ['COUNT(*) as count'], conditions);
    const result = await db.query(sql, params);
    return result[0].count;
  }

  /**
   * Pagination helper
   */
  static async paginate(table, options = {}) {
    const {
      page = 1,
      limit = 10,
      fields = ['*'],
      conditions = {},
      orderBy,
      orderDir = 'DESC',
      cachePrefix,
      ttl = 300,
    } = options;

    const offset = (page - 1) * limit;

    // Get total count
    const total = await this.count(table, conditions);

    // Get data
    const { sql, params } = this.optimizeSelect(
      table,
      fields,
      conditions,
      { limit, offset, orderBy, orderDir }
    );

    const data = await db.query(sql, params);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Invalidate related cache
   */
  static async invalidateRelatedCache(patterns) {
    const promises = patterns.map(p => cacheService.invalidatePattern(p));
    await Promise.all(promises);
  }

  /**
   * Database connection pool stats
   */
  static async getPoolStats() {
    try {
      const pool = db.pool;
      return {
        totalConnections: pool.pool._allConnections.length,
        freeConnections: pool.pool._freeConnections.length,
        queuedRequests: pool.pool._connectionQueue.length,
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = QueryOptimizer;
