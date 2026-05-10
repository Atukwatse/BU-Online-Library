/**
 * Comprehensive Logging Integration
 * Integrates logging throughout the application
 */

const { request: logRequest, error: logError, auth: logAuth, database: logDatabase, adminAction, file: logFile, performance: logPerformance } = require('../utils/logger');

/**
 * Request logging middleware (comprehensive)
 */
const comprehensiveRequestLogger = (req, res, next) => {
  req.startTime = Date.now();

  // Log request start
  logRequest(req, null, 0, { stage: 'start' });

  // Log on response finish
  res.on('finish', () => {
    const responseTime = Date.now() - req.startTime;
    
    logRequest(req, res, responseTime, {
      stage: 'complete',
      requestId: req.id,
    });

    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      logPerformance('slow_request', responseTime, {
        url: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
      });
    }

    // Log errors
    if (res.statusCode >= 400) {
      logError('http_error', new Error(`HTTP ${res.statusCode}`), {
        url: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        userId: req.user?.id,
      });
    }
  });

  next();
};

/**
 * Database query logging middleware
 */
const databaseQueryLogger = (req, res, next) => {
  const originalQuery = require('../config/mysql_database').query;
  
  // This would be implemented in the database config
  // For now, we'll log at the service level
  next();
};

/**
 * Authentication logging middleware
 */
const authLogger = (action) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    const success = res.statusCode < 400;

    res.json = function(data) {
      const userId = req.user?.id || null;
      const email = req.body?.email || req.user?.email || null;
      
      logAuth(action, userId, email, success, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return originalJson(data);
    };

    next();
  };
};

/**
 * Admin action logging middleware
 */
const adminActionLogger = (action) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    const success = res.statusCode < 400;

    res.json = function(data) {
      if (success && req.user && (req.user.role === 'Admin' || req.user.role === 'SuperAdmin')) {
        adminAction(
          req.user.id,
          action,
          req.originalUrl,
          {
            method: req.method,
            body: req.body,
            params: req.params,
            query: req.query,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
          }
        );
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * File operation logging middleware
 */
const fileOperationLogger = (operation) => {
  return (req, res, next) => {
    if (req.file) {
      logFile(operation, {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        userId: req.user?.id,
      });
    }

    next();
  };
};

/**
 * Performance monitoring middleware
 */
const performanceMonitor = (thresholdMs = 500) => {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > thresholdMs) {
        logPerformance('slow_endpoint', duration, {
          url: req.originalUrl,
          method: req.method,
          userId: req.user?.id,
          threshold: thresholdMs,
        });
      }
    });

    next();
  };
};

/**
 * Error logging middleware
 */
const errorLogger = (err, req, res, next) => {
  logError('application_error', err, {
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id,
  });

  next(err);
};

/**
 * Security event logging
 */
const securityEventLogger = (event) => {
  return (req, res, next) => {
    logError('security_event', new Error(event), {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    next();
  };
};

/**
 * Business event logging
 */
const businessEventLogger = (eventType, eventData) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    const success = res.statusCode < 400;

    res.json = function(data) {
      if (success) {
        logRequest(req, res, 0, {
          eventType,
          eventData: {
            ...eventData,
            userId: req.user?.id,
            ip: req.ip,
          },
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * API usage statistics logging
 */
const apiUsageLogger = () => {
  return (req, res, next) => {
    res.on('finish', () => {
      logRequest(req, res, Date.now() - req.startTime, {
        apiVersion: req.apiVersion,
        endpoint: req.route?.path || req.originalUrl,
        method: req.method,
        userId: req.user?.id,
        userRole: req.user?.role,
      });
    });

    next();
  };
};

module.exports = {
  comprehensiveRequestLogger,
  databaseQueryLogger,
  authLogger,
  adminActionLogger,
  fileOperationLogger,
  performanceMonitor,
  errorLogger,
  securityEventLogger,
  businessEventLogger,
  apiUsageLogger,
};
