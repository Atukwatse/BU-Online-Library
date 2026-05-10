const express = require('express');
const Download = require('../models/Download');
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Get download statistics (admin only)
router.get('/stats', protect, authorize('Admin'), asyncHandler(async (req, res, next) => {
  try {
    const stats = {
      total: await Download.countDocuments(),
      thisMonth: await Download.countDocuments({
        downloadDate: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }),
      mostDownloaded: await Download.aggregate([
        { $group: { _id: '$book', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
        { $unwind: '$book' },
        { $project: { title: '$book.title', author: '$book.author', downloadCount: '$count' } }
      ])
    };

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}));

// Get user's download history
router.get('/my-downloads', protect, asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const downloads = await Download.find({ user: req.user.id })
      .populate('book', 'title author')
      .sort({ downloadDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Download.countDocuments({ user: req.user.id });

    res.status(200).json({
      status: 'success',
      count: downloads.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: downloads,
    });
  } catch (error) {
    next(error);
  }
}));

module.exports = router;
