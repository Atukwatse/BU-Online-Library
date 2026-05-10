/**
 * API v1 Routes
 * Organized by resource
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('../mysql/authRoutes');
const bookRoutes = require('../mysql/bookRoutes');
const categoryRoutes = require('../mysql/categoryRoutes');
const downloadRoutes = require('../mysql/downloadRoutes');
const userRoutes = require('../mysql/userRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/categories', categoryRoutes);
router.use('/downloads', downloadRoutes);
router.use('/users', userRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API v1 is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
