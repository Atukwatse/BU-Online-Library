/**
 * API v2 Routes
 * Enhanced features with new modules
 */

const express = require('express');
const router = express.Router();

// Import enhanced route modules
const enhancedAuthRoutes = require('../mysql/enhancedAuthRoutes');
const otpRoutes = require('../mysql/otpRoutes');
const bookFeaturesRoutes = require('../mysql/bookFeaturesRoutes');
const searchRoutes = require('../mysql/searchRoutes');
const borrowingRoutes = require('../mysql/borrowingRoutes');
const notificationRoutes = require('../mysql/notificationRoutes');
const researchRoutes = require('../mysql/researchRoutes');
const printingRoutes = require('../mysql/printingRoutes');
const eventRoutes = require('../mysql/eventRoutes');
const analyticsRoutes = require('../mysql/analyticsRoutes');
const fileRoutes = require('../mysql/fileRoutes');

// Mount routes
router.use('/auth', enhancedAuthRoutes);
router.use('/auth/otp', otpRoutes);
router.use('/books', bookFeaturesRoutes);
router.use('/search', searchRoutes);
router.use('/borrowing', borrowingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/research', researchRoutes);
router.use('/printing', printingRoutes);
router.use('/events', eventRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/files', fileRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API v2 is running',
    version: '2.0.0',
    features: [
      'Enhanced authentication with refresh tokens',
      'OTP verification',
      'Book favorites, ratings, and reviews',
      'Smart search with filters',
      'Borrowing system',
      'Notifications',
      'Research support',
      'Printing services',
      'Event management',
      'Advanced analytics',
      'File management',
    ],
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
