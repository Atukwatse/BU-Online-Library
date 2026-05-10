/**
 * Audit Log Middleware
 * Logs important actions for security and compliance
 */

const { adminAction, request: logRequest, performance: logPerformance } = require('../utils/logger');

/**
 * Log HTTP requests
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log when response is sent
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logRequest(req, res, responseTime);
    
    // Log slow requests
    if (responseTime > 1000) {
      logPerformance('slow_request', responseTime, {
        url: req.originalUrl,
        method: req.method,
      });
    }
  });

  next();
};

/**
 * Log admin actions
 */
const auditLog = (action) => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after response
    res.json = function(data) {
      if (req.user && (req.user.role === 'Admin' || req.user.role === 'SuperAdmin') && res.statusCode < 400) {
        adminAction(
          req.user.id,
          action,
          req.originalUrl,
          {
            method: req.method,
            statusCode: res.statusCode,
            body: req.body,
            params: req.params,
          }
        );
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Log authentication events
 */
const authAuditLog = (action) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    const { auth: logAuth } = require('../utils/logger');

    res.json = function(data) {
      const success = res.statusCode < 400;
      const email = req.body?.email || req.user?.email || null;
      const userId = req.user?.id || null;

      logAuth(action, userId, email, success);
      return originalJson(data);
    };

    next();
  };
};

/**
 * Log data access
 */
const dataAccessLog = (resourceType) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (req.user && res.statusCode < 400) {
        adminAction(
          req.user.id,
          `data_access_${resourceType}`,
          req.originalUrl,
          {
            method: req.method,
            resourceId: req.params.id,
            resourceType,
          }
        );
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  requestLogger,
  auditLog,
  authAuditLog,
  dataAccessLog,
};
