/**
 * Enhanced Rate Limiting Middleware
 * Different limits for different endpoints
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');
const { rateLimit: logRateLimit } = require('../utils/logger');

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimit(req.ip, req.originalUrl, config.rateLimit.maxRequests, 0);
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Authentication rate limiter (stricter)
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMaxRequests,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logRateLimit(req.ip, req.originalUrl, config.rateLimit.authMaxRequests, 0);
    res.status(429).json({
      status: 'error',
      message: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    status: 'error',
    message: 'Too many password reset attempts, please try again later.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logRateLimit(req.ip, req.originalUrl, 3, 0);
    res.status(429).json({
      status: 'error',
      message: 'Too many password reset attempts, please try again later.',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Email verification rate limiter
 */
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    status: 'error',
    message: 'Too many verification attempts, please try again later.',
    code: 'VERIFICATION_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logRateLimit(req.ip, req.originalUrl, 5, 0);
    res.status(429).json({
      status: 'error',
      message: 'Too many verification attempts, please try again later.',
      code: 'VERIFICATION_RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    status: 'error',
    message: 'Too many upload attempts, please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logRateLimit(req.ip, req.originalUrl, 20, 0);
    res.status(429).json({
      status: 'error',
      message: 'Too many upload attempts, please try again later.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Search rate limiter
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    status: 'error',
    message: 'Too many search requests, please try again later.',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimit(req.ip, req.originalUrl, 30, 0);
    res.status(429).json({
      status: 'error',
      message: 'Too many search requests, please try again later.',
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * API key rate limiter (for future use with API keys)
 */
const createApiKeyLimiter = (maxRequests = 1000, windowMs = 60 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => {
      return req.headers['x-api-key'] || req.ip;
    },
    message: {
      status: 'error',
      message: 'API rate limit exceeded.',
      code: 'API_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  uploadLimiter,
  searchLimiter,
  createApiKeyLimiter,
};
