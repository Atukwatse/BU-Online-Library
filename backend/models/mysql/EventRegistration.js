/**
 * Event Registration Model
 */

const db = require('../../config/mysql_database');

class EventRegistration {
  /**
   * Register for an event
   */
  static async create(data) {
    const { userID, eventID } = data;
    
    const sql = `
      INSERT INTO EventRegistrations (UserID, EventID, RegistrationDate, Status, CreatedAt)
      VALUES (?, ?, NOW(), 'Registered', NOW())
    `;
    
    const result = await db.query(sql, [userID, eventID]);
    return result.insertId;
  }

  /**
   * Find registration by ID
   */
  static async findById(id) {
    const sql = `
      SELECT er.*, e.Title as EventTitle, e.EventDate, e.Location, u.FullName as UserName, u.Email as UserEmail
      FROM EventRegistrations er
      JOIN Events e ON er.EventID = e.EventID
      JOIN Users u ON er.UserID = u.UserID
      WHERE er.RegistrationID = ?
    `;
    
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Check if user is registered for event
   */
  static async isRegistered(userID, eventID) {
    const sql = `
      SELECT * FROM EventRegistrations
      WHERE UserID = ? AND EventID = ?
    `;
    
    const results = await db.query(sql, [userID, eventID]);
    return results.length > 0;
  }

  /**
   * Get registrations for an event
   */
  static async findByEvent(eventID, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT er.*, u.FullName, u.Email, u.Phone
      FROM EventRegistrations er
      JOIN Users u ON er.UserID = u.UserID
      WHERE er.EventID = ?
      ORDER BY er.RegistrationDate DESC
      LIMIT ? OFFSET ?
    `;
    
    const data = await db.query(sql, [eventID, limit, offset]);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM EventRegistrations WHERE EventID = ?`;
    const countResult = await db.query(countSql, [eventID]);
    const total = countResult[0].total;

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /**
   * Get user's event registrations
   */
  static async findByUser(userID, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT er.*, e.Title as EventTitle, e.EventDate, e.EventTime, e.Location, e.BannerImage
      FROM EventRegistrations er
      JOIN Events e ON er.EventID = e.EventID
      WHERE er.UserID = ?
      ORDER BY er.RegistrationDate DESC
      LIMIT ? OFFSET ?
    `;
    
    return await db.query(sql, [userID, limit, offset]);
  }

  /**
   * Cancel registration
   */
  static async cancel(registrationID) {
    const sql = `
      UPDATE EventRegistrations
      SET Status = 'Cancelled', CancelledAt = NOW()
      WHERE RegistrationID = ?
    `;
    
    await db.query(sql, [registrationID]);
  }

  /**
   * Mark attendance
   */
  static async markAttendance(registrationID) {
    const sql = `
      UPDATE EventRegistrations
      Set Status = 'Attended', AttendedAt = NOW()
      WHERE RegistrationID = ?
    `;
    
    await db.query(sql, [registrationID]);
  }

  /**
   * Get registration count for event
   */
  static async getRegistrationCount(eventID) {
    const sql = `
      SELECT COUNT(*) as count FROM EventRegistrations
      WHERE EventID = ? AND Status = 'Registered'
    `;
    
    const result = await db.query(sql, [eventID]);
    return result[0].count;
  }

  /**
   * Get attendance count for event
   */
  static async getAttendanceCount(eventID) {
    const sql = `
      SELECT COUNT(*) as count FROM EventRegistrations
      WHERE EventID = ? AND Status = 'Attended'
    `;
    
    const result = await db.query(sql, [eventID]);
    return result[0].count;
  }
}

module.exports = EventRegistration;
