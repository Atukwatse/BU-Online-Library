/**
 * Base Service Class
 * Provides common functionality for all services
 */

class BaseService {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find all records with pagination and filtering
   */
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, filters = {}, sortBy, sortOrder = 'DESC' } = options;
      const offset = (page - 1) * limit;

      const result = await this.model.findAll({
        limit,
        offset,
        filters,
        sortBy,
        sortOrder,
      });

      const total = await this.model.count(filters);

      return {
        data: result,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find record by ID
   */
  async findById(id) {
    try {
      const record = await this.model.findById(id);
      if (!record) {
        const { NotFoundError } = require('../utils/errors');
        throw new NotFoundError(`${this.model.name} not found`);
      }
      return record;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new record
   */
  async create(data) {
    try {
      return await this.model.create(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update record
   */
  async update(id, data) {
    try {
      const record = await this.findById(id);
      return await record.update(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete record (soft delete if supported)
   */
  async delete(id) {
    try {
      const record = await this.findById(id);
      await record.delete();
      return { success: true, message: `${this.model.name} deleted successfully` };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search records
   */
  async search(query, options = {}) {
    try {
      const { page = 1, limit = 10, filters = {} } = options;
      const offset = (page - 1) * limit;

      const result = await this.model.search(query, {
        limit,
        offset,
        filters,
      });

      const total = await this.model.searchCount(query, filters);

      return {
        data: result,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Count records
   */
  async count(filters = {}) {
    try {
      return await this.model.count(filters);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Batch create records
   */
  async batchCreate(dataArray) {
    try {
      return await this.model.batchCreate(dataArray);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Batch update records
   */
  async batchUpdate(ids, data) {
    try {
      return await this.model.batchUpdate(ids, data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Batch delete records
   */
  async batchDelete(ids) {
    try {
      return await this.model.batchDelete(ids);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BaseService;
