/**
 * API Modernization Middleware
 * Pagination, sorting, filtering, and API versioning
 */

const config = require('../config');
const { ValidationError } = require('../utils/errors');

/**
 * Pagination middleware
 */
const paginate = (defaultLimit = 10, maxLimit = 100) => {
  return (req, res, next) => {
    const page = parseInt(req.query.page) || config.pagination.defaultPage;
    const limit = parseInt(req.query.limit) || config.pagination.defaultLimit;

    // Validate and clamp values
    req.pagination = {
      page: Math.max(1, page),
      limit: Math.min(maxLimit, Math.max(1, limit)),
      offset: Math.max(0, (Math.max(1, page) - 1) * Math.min(maxLimit, Math.max(1, limit))),
    };

    next();
  };
};

/**
 * Sorting middleware
 */
const sort = (defaultSort = 'CreatedAt', defaultOrder = 'DESC') => {
  return (req, res, next) => {
    const sortBy = req.query.sortBy || defaultSort;
    const sortOrder = (req.query.sortOrder || defaultOrder).toUpperCase();

    // Validate sort order
    if (!['ASC', 'DESC'].includes(sortOrder)) {
      throw new ValidationError('Invalid sort order. Use ASC or DESC');
    }

    req.sort = {
      sortBy,
      sortOrder,
    };

    next();
  };
};

/**
 * Filtering middleware
 */
const filter = (allowedFilters = []) => {
  return (req, res, next) => {
    const filters = {};

    for (const filter of allowedFilters) {
      if (req.query[filter] !== undefined) {
        filters[filter] = req.query[filter];
      }
    }

    req.filters = filters;
    next();
  };
};

/**
 * Search middleware
 */
const search = (searchFields = []) => {
  return (req, res, next) => {
    const searchQuery = req.query.search || req.query.q;
    
    if (searchQuery) {
      req.search = {
        query: searchQuery,
        fields: searchFields,
      };
    }

    next();
  };
};

/**
 * API versioning middleware
 */
const apiVersion = (supportedVersions = ['v1', 'v2']) => {
  return (req, res, next) => {
    const version = req.headers['api-version'] || req.query.version || 'v1';

    if (!supportedVersions.includes(version)) {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported API version. Supported versions: ${supportedVersions.join(', ')}`,
        code: 'UNSUPPORTED_API_VERSION',
      });
    }

    req.apiVersion = version;
    next();
  };
};

/**
 * Response formatter middleware
 */
const formatResponse = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    const response = {
      status: data.status || 'success',
      timestamp: new Date().toISOString(),
      version: req.apiVersion || 'v1',
    };

    if (data.message) {
      response.message = data.message;
    }

    if (data.data !== undefined) {
      response.data = data.data;
    }

    if (data.pagination) {
      response.pagination = data.pagination;
    }

    if (data.errors) {
      response.errors = data.errors;
    }

    if (data.code) {
      response.code = data.code;
    }

    return originalJson.call(this, response);
  };

  next();
};

/**
 * Request ID middleware
 */
const requestId = () => {
  return (req, res, next) => {
    req.id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    res.setHeader('X-Request-ID', req.id);
    next();
  };
};

/**
 * CORS enhancement middleware
 */
const enhanceCORS = () => {
  return (req, res, next) => {
    res.setHeader('X-Powered-By', 'BU E-Library API');
    res.setHeader('X-Response-Time', Date.now() - req.startTime);
    next();
  };
};

/**
 * Query sanitizer
 */
const sanitizeQuery = (req, res, next) => {
  const sanitized = {};

  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      // Remove potential SQL injection patterns
      sanitized[key] = req.query[key].replace(/['";\\]/g, '');
    } else {
      sanitized[key] = req.query[key];
    }
  }

  req.query = sanitized;
  next();
};

/**
 * Field selection middleware
 */
const selectFields = (defaultFields = ['*'], allowedFields = []) => {
  return (req, res, next) => {
    const fieldsParam = req.query.fields;
    
    if (fieldsParam) {
      const requestedFields = fieldsParam.split(',').map(f => f.trim());
      
      // Validate fields
      if (allowedFields.length > 0) {
        const validFields = requestedFields.filter(f => allowedFields.includes(f));
        if (validFields.length === 0) {
          throw new ValidationError('No valid fields specified');
        }
        req.fields = validFields;
      } else {
        req.fields = requestedFields;
      }
    } else {
      req.fields = defaultFields;
    }

    next();
  };
};

/**
 * Expand relations middleware
 */
const expandRelations = (allowedRelations = []) => {
  return (req, res, next) => {
    const expandParam = req.query.expand;
    
    if (expandParam) {
      const requestedRelations = expandParam.split(',').map(r => r.trim());
      
      // Validate relations
      const validRelations = requestedRelations.filter(r => allowedRelations.includes(r));
      if (validRelations.length === 0) {
        throw new ValidationError('No valid relations specified');
      }
      req.expand = validRelations;
    }

    next();
  };
};

/**
 * API key middleware (for future use)
 */
const apiKey = (validKeys = []) => {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        status: 'error',
        message: 'API key required',
        code: 'API_KEY_REQUIRED',
      });
    }

    if (!validKeys.includes(apiKey)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid API key',
        code: 'INVALID_API_KEY',
      });
    }

    next();
  };
};

module.exports = {
  paginate,
  sort,
  filter,
  search,
  apiVersion,
  formatResponse,
  requestId,
  enhanceCORS,
  sanitizeQuery,
  selectFields,
  expandRelations,
  apiKey,
};
