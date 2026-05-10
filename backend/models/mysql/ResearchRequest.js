/**
 * Research Request Model
 */

const db = require('../../config/mysql_database');

class ResearchRequest {
  /**
   * Create a new research request
   */
  static async create(data) {
    const { userID, title, description, subject, priority, filePath } = data;
    
    const sql = `
      INSERT INTO ResearchRequests (UserID, Title, Description, Subject, Priority, FilePath, Status, RequestDate, CreatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())
    `;
    
    const result = await db.query(sql, [userID, title, description, subject, priority, filePath]);
    return result.insertId;
  }

  /**
   * Find research request by ID
   */
  static async findById(id) {
    const sql = `
      SELECT rr.*, u.FullName as UserName, u.Email as UserEmail
      FROM ResearchRequests rr
      JOIN Users u ON rr.UserID = u.UserID
      WHERE rr.RequestID = ?
    `;
    
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all research requests
   */
  static async findAll(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT rr.*, u.FullName as UserName
      FROM ResearchRequests rr
      JOIN Users u ON rr.UserID = u.UserID
      WHERE 1=1
    `;
    const params = [];

    if (filters.userID) {
      sql += ` AND rr.UserID = ?`;
      params.push(filters.userID);
    }
    if (filters.status) {
      sql += ` AND rr.Status = ?`;
      params.push(filters.status);
    }
    if (filters.priority) {
      sql += ` AND rr.Priority = ?`;
      params.push(filters.priority);
    }
    if (filters.subject) {
      sql += ` AND rr.Subject LIKE ?`;
      params.push(`%${filters.subject}%`);
    }

    sql += ` ORDER BY rr.CreatedAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const data = await db.query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM ResearchRequests WHERE 1=1`;
    const countParams = [];
    if (filters.userID) {
      countSql += ` AND UserID = ?`;
      countParams.push(filters.userID);
    }
    if (filters.status) {
      countSql += ` AND Status = ?`;
      countParams.push(filters.status);
    }
    if (filters.priority) {
      countSql += ` AND Priority = ?`;
      countParams.push(filters.priority);
    }
    if (filters.subject) {
      countSql += ` AND Subject LIKE ?`;
      countParams.push(`%${filters.subject}%`);
    }
    const countResult = await db.query(countSql, countParams);
    const total = countResult[0].total;

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /**
   * Update research request
   */
  static async update(id, data) {
    const { status, response, reviewedBy, filePath } = data;
    
    const sql = `
      UPDATE ResearchRequests
      SET Status = ?, Response = ?, ReviewedBy = ?, FilePath = COALESCE(?, FilePath), UpdatedAt = NOW()
      WHERE RequestID = ?
    `;
    
    await db.query(sql, [status, response, reviewedBy, filePath, id]);
  }

  /**
   * Delete research request
   */
  static async delete(id) {
    const sql = `DELETE FROM ResearchRequests WHERE RequestID = ?`;
    await db.query(sql, [id]);
  }

  /**
   * Get user's research requests
   */
  static async findByUser(userID, page = 1, limit = 20) {
    return await this.findAll({ userID }, page, limit);
  }

  /**
   * Get pending requests
   */
  static async getPendingRequests(page = 1, limit = 20) {
    return await this.findAll({ status: 'Pending' }, page, limit);
  }

  /**
   * Get research statistics
   */
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalRequests,
        COUNT(CASE WHEN Status = 'Pending' THEN 1 END) as pendingRequests,
        COUNT(CASE WHEN Status = 'In Review' THEN 1 END) as inReviewRequests,
        COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as completedRequests,
        COUNT(CASE WHEN Status = 'Rejected' THEN 1 END) as rejectedRequests
      FROM ResearchRequests
    `;
    
    const result = await db.query(sql);
    return result[0];
  }

  /**
   * Get requests by subject
   */
  static async getBySubject(subject, page = 1, limit = 20) {
    return await this.findAll({ subject }, page, limit);
  }
}

module.exports = ResearchRequest;
