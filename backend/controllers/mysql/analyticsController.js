/**
 * Analytics Controller
 */

const AnalyticsService = require('../../services/analyticsService');

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin,Staff
exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = await AnalyticsService.getDashboardStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/analytics/users
// @access  Private/Admin,Staff
exports.getUserStats = async (req, res, next) => {
  try {
    const stats = await AnalyticsService.getUserStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get book statistics
// @route   GET /api/analytics/books
// @access  Private/Admin,Staff
exports.getBookStats = async (req, res, next) => {
  try {
    const stats = await AnalyticsService.getBookStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get download statistics
// @route   GET /api/analytics/downloads
// @access  Private/Admin,Staff
exports.getDownloadStats = async (req, res, next) => {
  try {
    const stats = await AnalyticsService.getDownloadStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get borrowing statistics
// @route   GET /api/analytics/borrowings
// @access  Private/Admin,Staff
exports.getBorrowingStats = async (req, res, next) => {
  try {
    const stats = await AnalyticsService.getBorrowingStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event statistics
// @route   GET /api/analytics/events
// @access  Private/Admin,Staff
exports.getEventStats = async (req, res, next) => {
  try {
    const stats = await AnalyticsService.getEventStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get research statistics
// @route   GET /api/analytics/research
// @access  Private/Admin,Staff
exports.getResearchStats = async (req, res, next) => {
  try {
    const stats = await AnalyticsService.getResearchStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get printing statistics
// @route   GET /api/analytics/printing
// @access  Private/Admin,Staff
exports.getPrintingStats = async (req, res, next) => {
  try {
    const stats = await AnalyticsService.getPrintingStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly report
// @route   GET /api/analytics/monthly-report
// @access  Private/Admin,Staff
exports.getMonthlyReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const report = await AnalyticsService.getMonthlyReport(parseInt(year), parseInt(month));

    res.status(200).json({
      status: 'success',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular books
// @route   GET /api/analytics/popular-books
// @access  Private/Admin,Staff
exports.getPopularBooks = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const books = await AnalyticsService.getPopularBooks(limit || 10);

    res.status(200).json({
      status: 'success',
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user engagement metrics
// @route   GET /api/analytics/user-engagement
// @access  Private/Admin,Staff
exports.getUserEngagement = async (req, res, next) => {
  try {
    const engagement = await AnalyticsService.getUserEngagement();

    res.status(200).json({
      status: 'success',
      data: engagement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity timeline
// @route   GET /api/analytics/activity-timeline
// @access  Private/Admin,Staff
exports.getActivityTimeline = async (req, res, next) => {
  try {
    const { days } = req.query;
    const timeline = await AnalyticsService.getActivityTimeline(days || 30);

    res.status(200).json({
      status: 'success',
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category distribution
// @route   GET /api/analytics/category-distribution
// @access  Private/Admin,Staff
exports.getCategoryDistribution = async (req, res, next) => {
  try {
    const distribution = await AnalyticsService.getCategoryDistribution();

    res.status(200).json({
      status: 'success',
      data: distribution,
    });
  } catch (error) {
    next(error);
  }
};
