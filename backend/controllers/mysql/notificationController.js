/**
 * Notification Controller
 */

const NotificationService = require('../../services/notificationService');
const { ValidationError } = require('../../utils/errors');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly, type } = req.query;

    const options = {};
    if (page) options.page = parseInt(page);
    if (limit) options.limit = parseInt(limit);
    if (unreadOnly === 'true') options.unreadOnly = true;
    if (type) options.type = type;

    const result = await NotificationService.getUserNotifications(req.user.id, options);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);

    res.status(200).json({
      status: 'success',
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent notifications
// @route   GET /api/notifications/recent
// @access  Private
exports.getRecentNotifications = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const notifications = await NotificationService.getRecentNotifications(req.user.id, limit);

    res.status(200).json({
      status: 'success',
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    await NotificationService.markAsRead(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    await NotificationService.deleteNotification(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create system announcement (admin)
// @route   POST /api/notifications/announcement
// @access  Private/Admin
exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, role } = req.body;

    if (!title || !message) {
      throw new ValidationError('Title and message are required');
    }

    await NotificationService.notifySystemAnnouncement(title, message, role);

    res.status(201).json({
      status: 'success',
      message: 'Announcement sent successfully',
    });
  } catch (error) {
    next(error);
  }
};
