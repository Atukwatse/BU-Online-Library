/**
 * OTP Routes
 */

const express = require('express');
const otpController = require('../../controllers/mysql/otpController');
const { asyncHandler } = require('../../middleware/enhancedErrorHandler');
const { authenticateToken } = require('../../middleware/roleBasedAuth');
const { emailVerificationLimiter, passwordResetLimiter } = require('../../middleware/rateLimitMiddleware');
const { validate, schemas } = require('../../middleware/validationMiddleware');

const router = express.Router();

// Public routes
router.post('/request-password-reset', passwordResetLimiter, asyncHandler(otpController.requestPasswordResetOTP));
router.post('/reset-password', passwordResetLimiter, validate(schemas.resetPassword), asyncHandler(otpController.resetPasswordWithOTP));

// Protected routes
router.post('/request-verification', authenticateToken, emailVerificationLimiter, asyncHandler(otpController.requestVerificationOTP));
router.post('/verify-verification', authenticateToken, asyncHandler(otpController.verifyVerificationOTP));
router.post('/request-2fa', authenticateToken, emailVerificationLimiter, asyncHandler(otpController.request2FAOTP));
router.post('/verify-2fa', authenticateToken, asyncHandler(otpController.verify2FAOTP));

module.exports = router;
