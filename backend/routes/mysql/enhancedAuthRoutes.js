/**
 * Enhanced Authentication Routes with Refresh Token Support
 */

const express = require('express');
const enhancedAuthController = require('../../controllers/mysql/enhancedAuthController');
const { asyncHandler } = require('../../middleware/enhancedErrorHandler');
const { authenticateToken } = require('../../middleware/roleBasedAuth');
const { validate, schemas } = require('../../middleware/validationMiddleware');
const {
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} = require('../../middleware/rateLimitMiddleware');
const {
  checkFailedAttempts,
  recordFailedAttempt,
  resetFailedAttempts,
} = require('../../middleware/accountLockoutMiddleware');
const { authAuditLog } = require('../../middleware/auditLogMiddleware');

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, validate(schemas.register), authAuditLog('register'), asyncHandler(enhancedAuthController.register));
router.post('/login', authLimiter, checkFailedAttempts, validate(schemas.login), authAuditLog('login'), asyncHandler(enhancedAuthController.login), recordFailedAttempt, resetFailedAttempts);
router.post('/refresh', authLimiter, asyncHandler(enhancedAuthController.refreshToken));
router.post('/forgot-password', passwordResetLimiter, validate(schemas.forgotPassword), asyncHandler(enhancedAuthController.forgotPassword));
router.post('/reset-password', passwordResetLimiter, validate(schemas.resetPassword), asyncHandler(enhancedAuthController.resetPassword));
router.post('/verify-email', emailVerificationLimiter, asyncHandler(enhancedAuthController.verifyEmail));

// Protected routes
router.post('/logout', authenticateToken, asyncHandler(enhancedAuthController.logout));
router.get('/me', authenticateToken, asyncHandler(enhancedAuthController.getMe));
router.put('/profile', authenticateToken, validate(schemas.updateProfile), asyncHandler(enhancedAuthController.updateProfile));
router.put('/change-password', authenticateToken, validate(schemas.changePassword), asyncHandler(enhancedAuthController.changePassword));
router.post('/request-verification', authenticateToken, emailVerificationLimiter, asyncHandler(enhancedAuthController.requestVerification));
router.get('/sessions', authenticateToken, asyncHandler(enhancedAuthController.getSessions));
router.delete('/sessions/:id', authenticateToken, asyncHandler(enhancedAuthController.revokeSession));
router.post('/revoke-other-sessions', authenticateToken, asyncHandler(enhancedAuthController.revokeOtherSessions));

module.exports = router;
