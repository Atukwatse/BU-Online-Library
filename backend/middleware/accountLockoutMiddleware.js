/**
 * Account Lockout Middleware
 * Locks accounts after multiple failed login attempts
 */

const config = require('../config');
const { RateLimitError, AuthenticationError } = require('../utils/errors');
const { auth: logAuth } = require('../utils/logger');

// In-memory store for failed attempts (in production, use Redis)
const failedAttempts = new Map();

/**
 * Check and increment failed login attempts
 */
const checkFailedAttempts = async (req, res, next) => {
  const email = req.body.email;
  const ip = req.ip;

  if (!email) {
    return next();
  }

  const key = `${email}_${ip}`;
  const attempts = failedAttempts.get(key) || { count: 0, lastAttempt: null };

  // Check if account is locked
  if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60);
    logAuth('login_attempt_locked', null, email, false);
    
    return res.status(429).json({
      status: 'error',
      message: `Account locked due to too many failed attempts. Please try again in ${remainingTime} minutes.`,
      code: 'ACCOUNT_LOCKED',
      lockoutRemaining: remainingTime * 60, // seconds
    });
  }

  // Store for post-processing
  req.attemptKey = key;
  next();
};

/**
 * Record failed login attempt
 */
const recordFailedAttempt = (req, res, next) => {
  const key = req.attemptKey;
  
  // Only record if authentication failed
  if (res.statusCode === 401 && key) {
    const attempts = failedAttempts.get(key) || { count: 0, lastAttempt: null };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();

    // Lock account if max attempts reached
    if (attempts.count >= config.accountLockout.maxAttempts) {
      attempts.lockedUntil = Date.now() + config.accountLockout.lockoutDuration;
      logAuth('account_locked', null, req.body.email, false);
    }

    failedAttempts.set(key, attempts);

    // Auto-cleanup after lockout duration
    if (attempts.lockedUntil) {
      setTimeout(() => {
        failedAttempts.delete(key);
      }, config.accountLockout.lockoutDuration + 60000); // +1 minute buffer
    }
  }

  next();
};

/**
 * Reset failed attempts on successful login
 */
const resetFailedAttempts = (req, res, next) => {
  const key = req.attemptKey;
  
  // Only reset if authentication succeeded
  if (res.statusCode === 200 && key) {
    failedAttempts.delete(key);
  }

  next();
};

/**
 * Middleware to check if account is locked (for protected routes)
 */
const isAccountLocked = async (req, res, next) => {
  if (!req.user || !req.user.email) {
    return next();
  }

  const key = `${req.user.email}_${req.ip}`;
  const attempts = failedAttempts.get(key);

  if (attempts && attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60);
    
    return res.status(429).json({
      status: 'error',
      message: `Account is locked. Please try again in ${remainingTime} minutes.`,
      code: 'ACCOUNT_LOCKED',
      lockoutRemaining: remainingTime * 60,
    });
  }

  next();
};

/**
 * Manual account unlock (admin only)
 */
const unlockAccount = async (email) => {
  // Remove all attempts for this email from all IPs
  for (const [key, value] of failedAttempts.entries()) {
    if (key.startsWith(email + '_')) {
      failedAttempts.delete(key);
    }
  }
  return { success: true };
};

module.exports = {
  checkFailedAttempts,
  recordFailedAttempt,
  resetFailedAttempts,
  isAccountLocked,
  unlockAccount,
};
