/**
 * Notification Service
 * Handles notification creation and management
 */

const Notification = require('../models/mysql/Notification');
const { performance: logPerformance } = require('../utils/logger');

class NotificationService {
  /**
   * Create notification
   */
  static async createNotification(userID, type, title, message, data = {}) {
    const notificationId = await Notification.create({
      userID,
      type,
      title,
      message,
      data,
    });

    return { notificationId };
  }

  /**
   * Create borrow request notification
   */
  static async notifyBorrowRequestCreated(requestID, userID, bookTitle) {
    // Notify staff/admin
    const User = require('../models/mysql/User');
    const staffUsers = await User.findByRole('Staff');
    const adminUsers = await User.findByRole('Admin');

    const recipientIDs = [...staffUsers, ...adminUsers].map(u => u.UserID);

    if (recipientIDs.length > 0) {
      await Notification.createBulk(recipientIDs, {
        type: 'borrow_request',
        title: 'New Borrow Request',
        message: `A new borrow request has been submitted for "${bookTitle}"`,
        data: { requestID, userID },
      });
    }

    // Notify user
    await this.createNotification(
      userID,
      'borrow_request_submitted',
      'Borrow Request Submitted',
      `Your borrow request for "${bookTitle}" has been submitted and is pending approval.`,
      { requestID }
    );
  }

  /**
   * Create borrow approval notification
   */
  static async notifyBorrowApproved(userID, bookTitle, dueDate) {
    await this.createNotification(
      userID,
      'borrow_approved',
      'Borrow Request Approved',
      `Your borrow request for "${bookTitle}" has been approved. Due date: ${new Date(dueDate).toLocaleDateString()}`,
      { bookTitle, dueDate }
    );
  }

  /**
   * Create borrow rejection notification
   */
  static async notifyBorrowRejected(userID, bookTitle, reason) {
    await this.createNotification(
      userID,
      'borrow_rejected',
      'Borrow Request Rejected',
      `Your borrow request for "${bookTitle}" has been rejected. ${reason ? 'Reason: ' + reason : ''}`,
      { bookTitle, reason }
    );
  }

  /**
   * Create overdue notification
   */
  static async notifyOverdue(userID, bookTitle, daysOverdue) {
    await this.createNotification(
      userID,
      'book_overdue',
      'Book Overdue',
      `The book "${bookTitle}" is ${daysOverdue} days overdue. Please return it as soon as possible to avoid penalties.`,
      { bookTitle, daysOverdue }
    );
  }

  /**
   * Create book available notification
   */
  static async notifyBookAvailable(userID, bookTitle) {
    await this.createNotification(
      userID,
      'book_available',
      'Book Available',
      `The book "${bookTitle}" is now available for borrowing.`,
      { bookTitle }
    );
  }

  /**
   * Create event reminder notification
   */
  static async notifyEventReminder(userID, eventTitle, eventDate) {
    await this.createNotification(
      userID,
      'event_reminder',
      'Event Reminder',
      `Reminder: "${eventTitle}" is scheduled for ${new Date(eventDate).toLocaleDateString()}`,
      { eventTitle, eventDate }
    );
  }

  /**
   * Create event registration notification
   */
  static async notifyEventRegistered(userID, eventTitle) {
    await this.createNotification(
      userID,
      'event_registered',
      'Event Registration Confirmed',
      `You have successfully registered for "${eventTitle}"`,
      { eventTitle }
    );
  }

  /**
   * Create research request notification
   */
  static async notifyResearchRequestCreated(requestID, userID, title) {
    // Notify staff/admin
    const User = require('../models/mysql/User');
    const staffUsers = await User.findByRole('Staff');
    const adminUsers = await User.findByRole('Admin');

    const recipientIDs = [...staffUsers, ...adminUsers].map(u => u.UserID);

    if (recipientIDs.length > 0) {
      await Notification.createBulk(recipientIDs, {
        type: 'research_request',
        title: 'New Research Request',
        message: `A new research request "${title}" has been submitted`,
        data: { requestID, userID },
      });
    }

    // Notify user
    await this.createNotification(
      userID,
      'research_request_submitted',
      'Research Request Submitted',
      `Your research request "${title}" has been submitted and is pending review.`,
      { requestID, title }
    );
  }

  /**
   * Create research status update notification
   */
  static async notifyResearchStatusUpdate(userID, title, status) {
    await this.createNotification(
      userID,
      'research_status_update',
      'Research Request Update',
      `Your research request "${title}" status has been updated to: ${status}`,
      { title, status }
    );
  }

  /**
   * Create printing request notification
   */
  static async notifyPrintingRequestCreated(requestID, userID, title) {
    // Notify staff/admin
    const User = require('../models/mysql/User');
    const staffUsers = await User.findByRole('Staff');
    const adminUsers = await User.findByRole('Admin');

    const recipientIDs = [...staffUsers, ...adminUsers].map(u => u.UserID);

    if (recipientIDs.length > 0) {
      await Notification.createBulk(recipientIDs, {
        type: 'printing_request',
        title: 'New Printing Request',
        message: `A new printing request "${title}" has been submitted`,
        data: { requestID, userID },
      });
    }

    // Notify user
    await this.createNotification(
      userID,
      'printing_request_submitted',
      'Printing Request Submitted',
      `Your printing request "${title}" has been submitted and is pending approval.`,
      { requestID, title }
    );
  }

  /**
   * Create printing status update notification
   */
  static async notifyPrintingStatusUpdate(userID, title, status) {
    await this.createNotification(
      userID,
      'printing_status_update',
      'Printing Request Update',
      `Your printing request "${title}" status has been updated to: ${status}`,
      { title, status }
    );
  }

  /**
   * Create system announcement notification
   */
  static async notifySystemAnnouncement(title, message, role = null) {
    const User = require('../models/mysql/User');
    let userIDs;

    if (role) {
      const users = await User.findByRole(role);
      userIDs = users.map(u => u.UserID);
    } else {
      // All users
      const users = await User.findAll({ limit: 10000 });
      userIDs = users.data.map(u => u.UserID);
    }

    if (userIDs.length > 0) {
      await Notification.createBulk(userIDs, {
        type: 'system_announcement',
        title,
        message,
        data: {},
      });
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userID, options = {}) {
    return await Notification.findByUser(userID, options);
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userID) {
    return await Notification.getUnreadCount(userID);
  }

  /**
   * Mark as read
   */
  static async markAsRead(notificationID) {
    await Notification.markAsRead(notificationID);
    return { success: true };
  }

  /**
   * Mark all as read
   */
  static async markAllAsRead(userID) {
    await Notification.markAllAsRead(userID);
    return { success: true };
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationID) {
    await Notification.delete(notificationID);
    return { success: true };
  }

  /**
   * Get recent notifications
   */
  static async getRecentNotifications(userID, limit = 10) {
    return await Notification.getRecent(userID, limit);
  }
}

module.exports = NotificationService;
