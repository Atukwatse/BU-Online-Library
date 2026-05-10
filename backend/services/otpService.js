/**
 * OTP (One-Time Password) Service
 * Handles OTP generation and verification for 2FA and email verification
 */

const crypto = require('crypto');
const { ValidationError, AuthenticationError } = require('../utils/errors');
const { auth: logAuth } = require('../utils/logger');

class OTPService {
  /**
   * Generate a numeric OTP
   */
  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  /**
   * Generate alphanumeric OTP
   */
  static generateAlphanumericOTP(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += chars[Math.floor(Math.random() * chars.length)];
    }
    return otp;
  }

  /**
   * Generate OTP hash for storage
   */
  static generateOTPHash(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Store OTP in database (to be implemented with User model)
   */
  static async storeOTP(userId, otpHash, type = 'email_verification', expiryMinutes = 5) {
    const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
    
    // This would update the User model with OTP fields
    // await User.update(userId, {
    //   otp: otpHash,
    //   otpType: type,
    //   otpExpiry: expiry,
    // });

    return { success: true, expiry };
  }

  /**
   * Verify OTP
   */
  static async verifyOTP(userId, otp, type = 'email_verification') {
    const otpHash = this.generateOTPHash(otp);

    // This would check against the User model
    // const user = await User.findById(userId);
    // if (!user || user.otp !== otpHash || user.otpType !== type || user.otpExpiry < new Date()) {
    //   throw new AuthenticationError('Invalid or expired OTP');
    // }

    // Clear OTP after successful verification
    // await User.update(userId, {
    //   otp: null,
    //   otpType: null,
    //   otpExpiry: null,
    // });

    logAuth('otp_verified', userId, null, true);
    return { success: true };
  }

  /**
   * Generate and send OTP for email verification
   */
  static async sendEmailVerificationOTP(userId, email) {
    const otp = this.generateOTP(6);
    const otpHash = this.generateOTPHash(otp);
    
    await this.storeOTP(userId, otpHash, 'email_verification', 5);

    // In production, send email with OTP
    // await EmailService.sendOTPEmail(email, otp);

    logAuth('otp_sent_email_verification', userId, email, true);

    return {
      success: true,
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined, // Only return OTP in non-production
      message: 'OTP sent to your email',
    };
  }

  /**
   * Generate and send OTP for password reset
   */
  static async sendPasswordResetOTP(userId, email) {
    const otp = this.generateOTP(6);
    const otpHash = this.generateOTPHash(otp);
    
    await this.storeOTP(userId, otpHash, 'password_reset', 5);

    // In production, send email with OTP
    // await EmailService.sendOTPEmail(email, otp);

    logAuth('otp_sent_password_reset', userId, email, true);

    return {
      success: true,
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      message: 'OTP sent to your email',
    };
  }

  /**
   * Generate and send OTP for 2FA
   */
  static async send2FAOTP(userId, email) {
    const otp = this.generateOTP(6);
    const otpHash = this.generateOTPHash(otp);
    
    await this.storeOTP(userId, otpHash, '2fa', 5);

    // In production, send email or SMS with OTP
    // await EmailService.send2FAEmail(email, otp);

    logAuth('otp_sent_2fa', userId, email, true);

    return {
      success: true,
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      message: '2FA OTP sent',
    };
  }

  /**
   * Verify 2FA OTP during login
   */
  static async verify2FAOTP(userId, otp) {
    return await this.verifyOTP(userId, otp, '2fa');
  }

  /**
   * Rate limit OTP generation (prevent abuse)
   */
  static async checkOTPRateLimit(userId, type = 'email_verification') {
    // This would check database for recent OTP requests
    // const recentOTPs = await User.getRecentOTPRequests(userId, type, 15); // last 15 minutes
    // if (recentOTPs.length >= 3) {
    //   throw new RateLimitError('Too many OTP requests. Please wait before requesting another.');
    // }
    return true;
  }
}

module.exports = OTPService;
