const express = require('express');
const Download = require('../../models/mysql/Download');
const asyncHandler = require('../../middleware/asyncHandler');
const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// Get download statistics (admin only)
router.get('/stats', protect, authorize('Admin'), asyncHandler(async (req, res, next) => {
  try {
    const stats = await Download.getStats();
    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}));

// Get monthly download statistics (admin only)
router.get('/monthly', protect, authorize('Admin'), asyncHandler(async (req, res, next) => {
  try {
    const { months = 12 } = req.query;
    const stats = await Download.getMonthlyStats(parseInt(months));
    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}));

// Get popular books by downloads (admin only)
router.get('/popular-books', protect, authorize('Admin'), asyncHandler(async (req, res, next) => {
  try {
    const { limit = 10, days = 30 } = req.query;
    const popularBooks = await Download.getPopularBooks(parseInt(limit), parseInt(days));
    res.status(200).json({
      status: 'success',
      count: popularBooks.length,
      data: popularBooks,
    });
  } catch (error) {
    next(error);
  }
}));

// Get active users by downloads (admin only)
router.get('/active-users', protect, authorize('Admin'), asyncHandler(async (req, res, next) => {
  try {
    const { limit = 10, days = 30 } = req.query;
    const activeUsers = await Download.getActiveUsers(parseInt(limit), parseInt(days));
    res.status(200).json({
      status: 'success',
      count: activeUsers.length,
      data: activeUsers,
    });
  } catch (error) {
    next(error);
  }
}));

// Get user's download history
router.get('/my-downloads', protect, asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await Download.getUserDownloadHistory(req.user.id, parseInt(page), parseInt(limit));
    
    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}));

// Get recent downloads (admin only)
router.get('/recent', protect, authorize('Admin'), asyncHandler(async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const recentDownloads = await Download.getRecentDownloads(parseInt(limit));
    res.status(200).json({
      status: 'success',
      count: recentDownloads.length,
      data: recentDownloads.map(d => d.toJSON()),
    });
  } catch (error) {
    next(error);
  }
}));

// Check if user has downloaded a specific book
router.get('/check/:bookId', protect, asyncHandler(async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const hasDownloaded = await Download.hasUserDownloadedBook(req.user.id, parseInt(bookId));
    
    res.status(200).json({
      status: 'success',
      data: {
        hasDownloaded,
        bookId: parseInt(bookId),
        userId: req.user.id
      },
    });
  } catch (error) {
    next(error);
  }
}));

module.exports = router;
