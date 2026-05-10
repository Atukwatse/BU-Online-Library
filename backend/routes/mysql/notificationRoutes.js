/**
 * Notification Routes
 */

const express = require('express');
const notificationController = require('../../controllers/mysql/notificationController');
const { asyncHandler } = require('../../middleware/enhancedErrorHandler');
const { authenticateToken, authorize } = require('../../middleware/enhancedRoleBasedAuth');

const router = express.Router();

// Protected routes
router.get('/', authenticateToken, asyncHandler(notificationController.getNotifications));
router.get('/unread-count', authenticateToken, asyncHandler(notificationController.getUnreadCount));
router.get('/recent', authenticateToken, asyncHandler(notificationController.getRecentNotifications));
router.put('/:id/read', authenticateToken, asyncHandler(notificationController.markAsRead));
router.put('/read-all', authenticateToken, asyncHandler(notificationController.markAllAsRead));
router.delete('/:id', authenticateToken, asyncHandler(notificationController.deleteNotification));

// Admin routes
router.post('/announcement', authenticateToken, authorize('Admin', 'SuperAdmin'), asyncHandler(notificationController.createAnnouncement));

module.exports = router;
