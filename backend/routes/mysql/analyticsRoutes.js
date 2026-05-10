/**
 * Analytics Routes
 */

const express = require('express');
const analyticsController = require('../../controllers/mysql/analyticsController');
const { asyncHandler } = require('../../middleware/enhancedErrorHandler');
const { authenticateToken, authorize } = require('../../middleware/enhancedRoleBasedAuth');

const router = express.Router();

// All routes require admin/staff access
router.get('/dashboard', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getDashboardStats));
router.get('/users', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getUserStats));
router.get('/books', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getBookStats));
router.get('/downloads', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getDownloadStats));
router.get('/borrowings', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getBorrowingStats));
router.get('/events', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getEventStats));
router.get('/research', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getResearchStats));
router.get('/printing', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getPrintingStats));
router.get('/monthly-report', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getMonthlyReport));
router.get('/popular-books', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getPopularBooks));
router.get('/user-engagement', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getUserEngagement));
router.get('/activity-timeline', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getActivityTimeline));
router.get('/category-distribution', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(analyticsController.getCategoryDistribution));

module.exports = router;
