/**
 * Request Sanitization Middleware
 * Prevents XSS and injection attacks
 */

const xss = require('xss');

/**
 * Sanitize request body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Sanitize request query parameters
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

/**
 * Sanitize request parameters
 */
const sanitizeParams = (req, res, next) => {
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Recursive sanitization function
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        // Sanitize string values
        sanitized[key] = xss(obj[key], {
          whiteList: {}, // No HTML tags allowed
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script'],
        });
      } else if (typeof obj[key] === 'object') {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        // Keep non-string, non-object values as is
        sanitized[key] = obj[key];
      }
    }
  }

  return sanitized;
};

/**
 * SQL Injection prevention middleware
 * Checks for common SQL injection patterns
 */
const preventSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"].*['"]\s*=\s*['"].*['"])/i,
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }
    return false;
  };

  const scanObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (checkValue(obj[key])) {
          return true;
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (scanObject(obj[key])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Scan body, query, and params
  if ((req.body && scanObject(req.body)) ||
      (req.query && scanObject(req.query)) ||
      (req.params && scanObject(req.params))) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid request detected',
      code: 'INVALID_REQUEST',
    });
  }

  next();
};

/**
 * NoSQL Injection prevention middleware
 */
const preventNoSQLInjection = (req, res, next) => {
  const noSQLPatterns = [
    /\$where/i,
    /\$ne/i,
    /\$gt/i,
    /\$lt/i,
    /\$in/i,
    /\$nin/i,
    /\$or/i,
    /\$and/i,
    /\$not/i,
    /\$regex/i,
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of noSQLPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }
    return false;
  };

  const scanObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (checkValue(obj[key]) || checkValue(key)) {
          return true;
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (scanObject(obj[key])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  if ((req.body && scanObject(req.body)) ||
      (req.query && scanObject(req.query)) ||
      (req.params && scanObject(req.params))) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid request detected',
      code: 'INVALID_REQUEST',
    });
  }

  next();
};

module.exports = {
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  preventSQLInjection,
  preventNoSQLInjection,
};
