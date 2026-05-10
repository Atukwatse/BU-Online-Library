/**
 * Notification Model
 */

const db = require('../../config/mysql_database');

class Notification {
  /**
   * Create a new notification
   */
  static async create(data) {
    const { userID, type, title, message, data: extraData } = data;
    
    const sql = `
      INSERT INTO Notifications (UserID, Type, Title, Message, Data, IsRead, CreatedAt)
      VALUES (?, ?, ?, ?, ?, 0, NOW())
    `;
    
    const result = await db.query(sql, [userID, type, title, message, JSON.stringify(extraData || {})]);
    return result.insertId;
  }

  /**
   * Find notification by ID
   */
  static async findById(id) {
    const sql = `SELECT * FROM Notifications WHERE NotificationID = ?`;
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all notifications for a user
   */
  static async findByUser(userID, options = {}) {
    const { page = 1, limit = 20, unreadOnly = false, type } = options;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT * FROM Notifications
      WHERE UserID = ?
    `;
    const params = [userID];

    if (unreadOnly) {
      sql += ` AND IsRead = 0`;
    }

    if (type) {
      sql += ` AND Type = ?`;
      params.push(type);
    }

    sql += ` ORDER BY CreatedAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const data = await db.query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM Notifications WHERE UserID = ?`;
    const countParams = [userID];
    if (unreadOnly) {
      countSql += ` AND IsRead = 0`;
    }
    if (type) {
      countSql += ` AND Type = ?`;
      countParams.push(type);
    }
    const countResult = await db.query(countSql, countParams);
    const total = countResult[0].total;

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id) {
    const sql = `
      UPDATE Notifications
      SET IsRead = 1, ReadAt = NOW()
      WHERE NotificationID = ?
    `;
    
    await db.query(sql, [id]);
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userID) {
    const sql = `
      UPDATE Notifications
      SET IsRead = 1, ReadAt = NOW()
      WHERE UserID = ? AND IsRead = 0
    `;
    
    await db.query(sql, [userID]);
  }

  /**
   * Delete notification
   */
  static async delete(id) {
    const sql = `DELETE FROM Notifications WHERE NotificationID = ?`;
    await db.query(sql, [id]);
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllForUser(userID) {
    const sql = `DELETE FROM Notifications WHERE UserID = ?`;
    await db.query(sql, [userID]);
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userID) {
    const sql = `
      SELECT COUNT(*) as count FROM Notifications
      WHERE UserID = ? AND IsRead = 0
    `;
    
    const result = await db.query(sql, [userID]);
    return result[0].count;
  }

  /**
   * Create notification for multiple users
   */
  static async createBulk(userIDs, notificationData) {
    const { type, title, message, data: extraData } = notificationData;
    
    const sql = `
      INSERT INTO Notifications (UserID, Type, Title, Message, Data, IsRead, CreatedAt)
      VALUES (?, ?, ?, ?, ?, 0, NOW())
    `;

    const promises = userIDs.map(userID => 
      db.query(sql, [userID, type, title, message, JSON.stringify(extraData || {})])
    );

    await Promise.all(promises);
    return { success: true, count: userIDs.length };
  }

  /**
   * Get notifications by type
   */
  static async findByType(userID, type, page = 1, limit = 20) {
    return await this.findByUser(userID, { page, limit, type });
  }

  /**
   * Get recent notifications
   */
  static async getRecent(userID, limit = 10) {
    const sql = `
      SELECT * FROM Notifications
      WHERE UserID = ?
      ORDER BY CreatedAt DESC
      LIMIT ?
    `;
    
    return await db.query(sql, [userID, limit]);
  }

  /**
   * Clean up old notifications (older than 30 days and read)
   */
  static async cleanupOld() {
    const sql = `
      DELETE FROM Notifications
      WHERE IsRead = 1 AND ReadAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    await db.query(sql);
    return { success: true };
  }
}

module.exports = Notification;
