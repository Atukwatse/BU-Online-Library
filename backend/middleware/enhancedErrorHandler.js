/**
 * Enhanced Centralized Error Handler
 */
const { logger, error: logError } = require('../utils/logger');
const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  RateLimitError,
  FileUploadError,
} = require('../utils/errors');

/**
 * Handle operational errors (known errors)
 */
const handleOperationalError = (err, res) => {
  const response = {
    status: 'error',
    message: err.message,
    code: err.code,
  };

  // Add validation errors if present
  if (err instanceof ValidationError && err.errors) {
    response.errors = err.errors;
  }

  return res.status(err.statusCode).json(response);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return new AuthenticationError('Invalid or expired token. Please log in again.');
};

/**
 * Handle JWT expired error
 */
const handleJWTExpiredError = () => {
  return new AuthenticationError('Your token has expired. Please log in again.');
};

/**
 * Handle Sequelize/Mysql errors
 */
const handleDBError = (err) => {
  if (err.code === 'ER_DUP_ENTRY') {
    return new ConflictError('A record with this information already exists.');
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return new ValidationError('Referenced record does not exist.');
  }
  if (err.code === 'ECONNREFUSED') {
    return new DatabaseError('Database connection failed.');
  }
  return new DatabaseError('Database operation failed.');
};

/**
 * Handle Multer errors
 */
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new FileUploadError('File size exceeds the allowed limit.');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new FileUploadError('Unexpected file field.');
  }
  return new FileUploadError('File upload failed.');
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error
  logError('Error occurred', err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || null,
  });

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else if (err.code && err.code.startsWith('ER_')) {
    error = handleDBError(err);
  } else if (err.name === 'MulterError') {
    error = handleMulterError(err);
  }

  // Handle operational errors
  if (error instanceof AppError) {
    return handleOperationalError(error, res);
  }

  // Handle unknown errors in production vs development
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_ERROR',
    });
  }

  // Development: send full error details
  return res.status(error.statusCode).json({
    status: 'error',
    message: error.message,
    stack: err.stack,
    code: error.code || 'INTERNAL_ERROR',
  });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Route not found: ${req.originalUrl}`);
  next(error);
};

/**
 * Async handler wrapper to catch errors in async functions
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
};
