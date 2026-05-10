/**
 * OTP Controller
 * Handles OTP-related endpoints
 */

const OTPService = require('../../services/otpService');
const { ValidationError, RateLimitError } = require('../../utils/errors');
const { emailVerificationLimiter, passwordResetLimiter } = require('../../middleware/rateLimitMiddleware');

// @desc    Request OTP for email verification
// @route   POST /api/auth/otp/request-verification
// @access  Private
exports.requestVerificationOTP = async (req, res, next) => {
  try {
    await OTPService.checkOTPRateLimit(req.user.id, 'email_verification');
    const result = await OTPService.sendEmailVerificationOTP(req.user.id, req.user.email);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: process.env.NODE_ENV !== 'production' ? { otp: result.otp } : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP for email verification
// @route   POST /api/auth/otp/verify-verification
// @access  Private
exports.verifyVerificationOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      throw new ValidationError('OTP is required');
    }

    await OTPService.verifyOTP(req.user.id, otp, 'email_verification');

    // Update user email verified status
    const User = require('../../models/mysql/User');
    await User.update(req.user.id, { emailVerified: true });

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request OTP for password reset
// @route   POST /api/auth/otp/request-password-reset
// @access  Public
exports.requestPasswordResetOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    const User = require('../../models/mysql/User');
    const user = await User.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        status: 'success',
        message: 'If an account exists with this email, an OTP will be sent.',
      });
    }

    await OTPService.checkOTPRateLimit(user.UserID, 'password_reset');
    const result = await OTPService.sendPasswordResetOTP(user.UserID, email);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: process.env.NODE_ENV !== 'production' ? { otp: result.otp } : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/otp/reset-password
// @access  Public
exports.resetPasswordWithOTP = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      throw new ValidationError('Email, OTP, and new password are required');
    }

    const User = require('../../models/mysql/User');
    const user = await User.findByEmail(email);

    if (!user) {
      throw new ValidationError('Invalid email or OTP');
    }

    await OTPService.verifyOTP(user.UserID, otp, 'password_reset');

    // Update password
    await user.update({ password: newPassword });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request 2FA OTP
// @route   POST /api/auth/otp/request-2fa
// @access  Private
exports.request2FAOTP = async (req, res, next) => {
  try {
    await OTPService.checkOTPRateLimit(req.user.id, '2fa');
    const result = await OTPService.send2FAOTP(req.user.id, req.user.email);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: process.env.NODE_ENV !== 'production' ? { otp: result.otp } : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 2FA OTP
// @route   POST /api/auth/otp/verify-2fa
// @access  Private
exports.verify2FAOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      throw new ValidationError('OTP is required');
    }

    await OTPService.verify2FAOTP(req.user.id, otp);

    res.status(200).json({
      status: 'success',
      message: '2FA verified successfully',
    });
  } catch (error) {
    next(error);
  }
};
