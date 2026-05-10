/**
 * Authentication Service
 * Handles authentication logic separate from controllers
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/mysql/User');
const { AuthenticationError, ConflictError, ValidationError } = require('../utils/errors');
const { auth: logAuth } = require('../utils/logger');

class AuthService {
  /**
   * Generate access token
   */
  static generateAccessToken(userId) {
    return jwt.sign(
      { id: userId, type: 'access' },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
    );
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
  }

  /**
   * Generate tokens pair
   */
  static async generateTokens(userId) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);
    
    // Store refresh token hash in database (to be implemented with RefreshToken model)
    // await this.storeRefreshToken(userId, refreshToken);
    
    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key');
    } catch (error) {
      return null;
    }
  }

  /**
   * Register new user
   */
  static async register(userData) {
    const { fullName, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'Student',
      dateRegistered: new Date(),
    });

    logAuth('register', user.UserID, email, true);

    return user;
  }

  /**
   * Login user
   */
  static async login(email, password) {
    // Find user with password
    const user = await User.findByEmailWithPassword(email);
    
    if (!user) {
      logAuth('login', null, email, false);
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if account is suspended
    if (user.Status === 'Suspended') {
      logAuth('login', user.UserID, email, false);
      throw new AuthenticationError('Account is suspended. Please contact administrator.');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logAuth('login', user.UserID, email, false);
      throw new AuthenticationError('Invalid credentials');
    }

    // Update last login
    await user.updateLastLogin();

    logAuth('login', user.UserID, email, true);

    return user;
  }

  /**
   * Refresh access token
   */
  static async refreshTokens(refreshToken) {
    const decoded = this.verifyRefreshToken(refreshToken);
    
    if (!decoded || decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Verify refresh token is still valid in database (to be implemented)
    // const isValid = await this.validateRefreshToken(decoded.id, refreshToken);
    // if (!isValid) {
    //   throw new AuthenticationError('Refresh token has been revoked');
    // }

    // Get user
    const user = await User.findById(decoded.id);
    if (!user || user.Status === 'Suspended') {
      throw new AuthenticationError('User not found or account suspended');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user.UserID);

    return tokens;
  }

  /**
   * Logout user (invalidate refresh token)
   */
  static async logout(userId, refreshToken) {
    // Invalidate refresh token in database (to be implemented)
    // await this.invalidateRefreshToken(userId, refreshToken);
    
    logAuth('logout', userId, null, true);
    
    return { success: true };
  }

  /**
   * Generate password reset token
   */
  static async generatePasswordResetToken(email) {
    const user = await User.findByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists or not
      return { success: true };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store in database (to be implemented with User model update)
    // await user.update({
    //   resetToken: resetTokenHash,
    //   resetTokenExpiry,
    // });

    logAuth('password_reset_request', user.UserID, email, true);

    return {
      success: true,
      resetToken, // Send this via email
      email: user.Email,
    };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token, newPassword) {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token (to be implemented)
    // const user = await User.findByResetToken(resetTokenHash);
    
    // if (!user || user.resetTokenExpiry < new Date()) {
    //   throw new AuthenticationError('Invalid or expired reset token');
    // }

    // Update password
    // await user.update({
    //   password: newPassword,
    //   resetToken: null,
    //   resetTokenExpiry: null,
    // });

    logAuth('password_reset', user.UserID, user.Email, true);

    return { success: true };
  }

  /**
   * Change password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByEmailWithPassword(userId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    await user.update({ password: newPassword });

    logAuth('password_change', user.UserID, user.Email, true);

    return { success: true };
  }

  /**
   * Generate email verification token
   */
  static async generateEmailVerificationToken(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Store in database (to be implemented)
    // await user.update({
    //   verificationToken: verificationTokenHash,
    // });

    logAuth('email_verification_request', user.UserID, user.Email, true);

    return {
      success: true,
      verificationToken,
      email: user.Email,
    };
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token) {
    const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid verification token (to be implemented)
    // const user = await User.findByVerificationToken(verificationTokenHash);
    
    // if (!user) {
    //   throw new AuthenticationError('Invalid verification token');
    // }

    // Mark email as verified
    // await user.update({
    //   emailVerified: true,
    //   verificationToken: null,
    // });

    logAuth('email_verified', user.UserID, user.Email, true);

    return { success: true };
  }
}

module.exports = AuthService;
