/**
 * Event Model
 */

const db = require('../../config/mock_database');

class Event {
  /**
   * Create a new event
   */
  static async create(data) {
    const { title, description, location, eventDate, eventTime, registrationDeadline, maxAttendees, bannerImage, organizerID } = data;
    
    const sql = `
      INSERT INTO Events (Title, Description, Location, EventDate, EventTime, RegistrationDeadline, MaxAttendees, BannerImage, OrganizerID, Status, CreatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming', NOW())
    `;
    
    const result = await db.query(sql, [title, description, location, eventDate, eventTime, registrationDeadline, maxAttendees, bannerImage, organizerID]);
    return result.insertId;
  }

  /**
   * Find event by ID
   */
  static async findById(id) {
    const sql = `
      SELECT e.*, u.FullName as OrganizerName
      FROM Events e
      LEFT JOIN Users u ON e.OrganizerID = u.UserID
      WHERE e.EventID = ?
    `;
    
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all events
   */
  static async findAll(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT e.*, u.FullName as OrganizerName,
        (SELECT COUNT(*) FROM EventRegistrations WHERE EventID = e.EventID) as RegisteredCount
      FROM Events e
      LEFT JOIN Users u ON e.OrganizerID = u.UserID
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      sql += ` AND e.Status = ?`;
      params.push(filters.status);
    }
    if (filters.organizerID) {
      sql += ` AND e.OrganizerID = ?`;
      params.push(filters.organizerID);
    }

    sql += ` ORDER BY e.EventDate DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const data = await db.query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM Events WHERE 1=1`;
    const countParams = [];
    if (filters.status) {
      countSql += ` AND Status = ?`;
      countParams.push(filters.status);
    }
    if (filters.organizerID) {
      countSql += ` AND OrganizerID = ?`;
      countParams.push(filters.organizerID);
    }
    const countResult = await db.query(countSql, countParams);
    const total = countResult[0].total;

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /**
   * Update event
   */
  static async update(id, data) {
    const { title, description, location, eventDate, eventTime, registrationDeadline, maxAttendees, bannerImage, status } = data;
    
    const sql = `
      UPDATE Events
      SET Title = COALESCE(?, Title),
          Description = COALESCE(?, Description),
          Location = COALESCE(?, Location),
          EventDate = COALESCE(?, EventDate),
          EventTime = COALESCE(?, EventTime),
          RegistrationDeadline = COALESCE(?, RegistrationDeadline),
          MaxAttendees = COALESCE(?, MaxAttendees),
          BannerImage = COALESCE(?, BannerImage),
          Status = COALESCE(?, Status),
          UpdatedAt = NOW()
      WHERE EventID = ?
    `;
    
    await db.query(sql, [title, description, location, eventDate, eventTime, registrationDeadline, maxAttendees, bannerImage, status, id]);
  }

  /**
   * Delete event
   */
  static async delete(id) {
    const sql = `DELETE FROM Events WHERE EventID = ?`;
    await db.query(sql, [id]);
  }

  /**
   * Get upcoming events
   */
  static async getUpcomingEvents(limit = 10) {
    const sql = `
      SELECT e.*, u.FullName as OrganizerName,
        (SELECT COUNT(*) FROM EventRegistrations WHERE EventID = e.EventID) as RegisteredCount
      FROM Events e
      LEFT JOIN Users u ON e.OrganizerID = u.UserID
      WHERE e.Status = 'Upcoming' AND e.EventDate >= CURDATE()
      ORDER BY e.EventDate ASC
      LIMIT ?
    `;
    
    return await db.query(sql, [limit]);
  }

  /**
   * Get past events
   */
  static async getPastEvents(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT e.*, u.FullName as OrganizerName,
        (SELECT COUNT(*) FROM EventRegistrations WHERE EventID = e.EventID) as RegisteredCount
      FROM Events e
      LEFT JOIN Users u ON e.OrganizerID = u.UserID
      WHERE e.EventDate < CURDATE() OR e.Status = 'Completed'
      ORDER BY e.EventDate DESC
      LIMIT ? OFFSET ?
    `;
    
    return await db.query(sql, [limit, offset]);
  }

  /**
   * Get event statistics
   */
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalEvents,
        COUNT(CASE WHEN Status = 'Upcoming' THEN 1 END) as upcomingEvents,
        COUNT(CASE WHEN Status = 'Ongoing' THEN 1 END) as ongoingEvents,
        COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as completedEvents,
        COUNT(CASE WHEN Status = 'Cancelled' THEN 1 END) as cancelledEvents
      FROM Events
    `;
    
    const result = await db.query(sql);
    return result[0];
  }
}

module.exports = Event;
