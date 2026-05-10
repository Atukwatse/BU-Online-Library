/**
 * Enhanced Authentication Controller with Refresh Token Support
 */

const AuthService = require('../../services/authService');
const { ValidationError, AuthenticationError } = require('../../utils/errors');
const { authAuditLog } = require('../../middleware/auditLogMiddleware');
const RefreshToken = require('../../models/mysql/RefreshToken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const user = await AuthService.register(req.body);
    const tokens = await AuthService.generateTokens(user.UserID);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await AuthService.login(email, password);
    const tokens = await AuthService.generateTokens(user.UserID);

    // Store refresh token
    await RefreshToken.create({
      userId: user.UserID,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Verify refresh token exists and is valid
    const tokenRecord = await RefreshToken.findByToken(refreshToken);
    if (!tokenRecord) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Generate new tokens
    const tokens = await AuthService.refreshTokens(refreshToken);

    // Revoke old refresh token and store new one (token rotation)
    await RefreshToken.revoke(refreshToken);
    await RefreshToken.create({
      userId: tokenRecord.UserID,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(200).json({
      status: 'success',
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    // Revoke refresh token if provided
    if (refreshToken) {
      await RefreshToken.revoke(refreshToken);
    }

    // Revoke all refresh tokens for this user
    await RefreshToken.revokeAllForUser(req.user.id);

    await AuthService.logout(req.user.id, refreshToken);

    res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const User = require('../../models/mysql/User');
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const stats = await user.getStats();

    res.status(200).json({
      status: 'success',
      data: {
        ...user.toJSON(),
        ...stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const UserService = require('../../services/userService');
    const user = await UserService.updateUser(req.user.id, req.body);

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await AuthService.changePassword(req.user.id, currentPassword, newPassword);

    // Revoke all refresh tokens for security
    await RefreshToken.revokeAllForUser(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await AuthService.generatePasswordResetToken(email);

    // In production, send email with reset token
    // For now, return token (for testing only)
    if (process.env.NODE_ENV !== 'production') {
      res.status(200).json({
        status: 'success',
        message: 'Password reset token generated',
        data: result,
      });
    } else {
      res.status(200).json({
        status: 'success',
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await AuthService.resetPassword(token, newPassword);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request email verification
// @route   POST /api/auth/request-verification
// @access  Private
exports.requestVerification = async (req, res, next) => {
  try {
    const result = await AuthService.generateEmailVerificationToken(req.user.id);

    // In production, send email with verification token
    if (process.env.NODE_ENV !== 'production') {
      res.status(200).json({
        status: 'success',
        message: 'Verification email sent',
        data: result,
      });
    } else {
      res.status(200).json({
        status: 'success',
        message: 'Verification email has been sent to your email address.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    await AuthService.verifyEmail(token);

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active sessions
// @route   GET /api/auth/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    const tokens = await RefreshToken.findByUserId(req.user.id);

    res.status(200).json({
      status: 'success',
      data: tokens.map(t => ({
        id: t.RefreshTokenID,
        createdAt: t.CreatedAt,
        expiresAt: t.ExpiresAt,
        ipAddress: t.IPAddress,
        userAgent: t.UserAgent,
        isCurrent: t.Token === req.headers.authorization?.split(' ')[1],
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke session
// @route   DELETE /api/auth/sessions/:id
// @access  Private
exports.revokeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get the token
    const tokens = await RefreshToken.findByUserId(req.user.id);
    const token = tokens.find(t => t.RefreshTokenID === parseInt(id));
    
    if (!token) {
      throw new ValidationError('Session not found');
    }

    await RefreshToken.revoke(token.Token);

    res.status(200).json({
      status: 'success',
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke all sessions except current
// @route   POST /api/auth/revoke-other-sessions
// @access  Private
exports.revokeOtherSessions = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    await RefreshToken.revokeAllExcept(req.user.id, refreshToken);

    res.status(200).json({
      status: 'success',
      message: 'All other sessions revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};
