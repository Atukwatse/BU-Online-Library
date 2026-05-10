/**
 * Centralized Logging System using Winston
 */
const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'bu-elibrary-api' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Auth log file
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/auth.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Logging helper functions
const loggers = {
  // Request logging
  request: (req, res, responseTime) => {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
    });
  },

  // Error logging
  error: (message, error = {}, context = {}) => {
    logger.error(message, {
      error: error.message,
      stack: error.stack,
      ...context,
    });
  },

  // Authentication logging
  auth: (action, userId, email, success = true) => {
    const level = success ? 'info' : 'warn';
    logger.log(level, 'Authentication', {
      action,
      userId,
      email,
      success,
      timestamp: new Date().toISOString(),
    });
  },

  // Database operation logging
  database: (operation, table, duration, success = true) => {
    const level = success ? 'info' : 'error';
    logger.log(level, 'Database Operation', {
      operation,
      table,
      duration: `${duration}ms`,
      success,
    });
  },

  // Admin action logging
  adminAction: (adminId, action, resource, details = {}) => {
    logger.info('Admin Action', {
      adminId,
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // File operation logging
  fileOperation: (operation, fileName, userId, success = true) => {
    const level = success ? 'info' : 'error';
    logger.log(level, 'File Operation', {
      operation,
      fileName,
      userId,
      success,
    });
  },

  // API rate limit logging
  rateLimit: (ip, endpoint, limit, remaining) => {
    logger.warn('Rate Limit', {
      ip,
      endpoint,
      limit,
      remaining,
      timestamp: new Date().toISOString(),
    });
  },

  // Performance logging
  performance: (operation, duration, metadata = {}) => {
    const level = duration > 1000 ? 'warn' : 'info';
    logger.log(level, 'Performance', {
      operation,
      duration: `${duration}ms`,
      ...metadata,
    });
  },
};

module.exports = {
  logger,
  ...loggers,
};
