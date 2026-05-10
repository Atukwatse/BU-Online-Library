/**
 * Printing Request Model
 */

const db = require('../../config/mysql_database');

class PrintingRequest {
  /**
   * Create a new printing request
   */
  static async create(data) {
    const { userID, title, description, pageCount, color, copies, priority, filePath } = data;
    
    const sql = `
      INSERT INTO PrintingRequests (UserID, Title, Description, PageCount, Color, Copies, Priority, FilePath, Status, RequestDate, CreatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())
    `;
    
    const result = await db.query(sql, [userID, title, description, pageCount, color, copies, priority, filePath]);
    return result.insertId;
  }

  /**
   * Find printing request by ID
   */
  static async findById(id) {
    const sql = `
      SELECT pr.*, u.FullName as UserName, u.Email as UserEmail
      FROM PrintingRequests pr
      JOIN Users u ON pr.UserID = u.UserID
      WHERE pr.RequestID = ?
    `;
    
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all printing requests
   */
  static async findAll(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT pr.*, u.FullName as UserName
      FROM PrintingRequests pr
      JOIN Users u ON pr.UserID = u.UserID
      WHERE 1=1
    `;
    const params = [];

    if (filters.userID) {
      sql += ` AND pr.UserID = ?`;
      params.push(filters.userID);
    }
    if (filters.status) {
      sql += ` AND pr.Status = ?`;
      params.push(filters.status);
    }
    if (filters.priority) {
      sql += ` AND pr.Priority = ?`;
      params.push(filters.priority);
    }

    sql += ` ORDER BY pr.CreatedAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const data = await db.query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM PrintingRequests WHERE 1=1`;
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
    const countResult = await db.query(countSql, countParams);
    const total = countResult[0].total;

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /**
   * Update printing request
   */
  static async update(id, data) {
    const { status, notes, approvedBy, completedDate } = data;
    
    const sql = `
      UPDATE PrintingRequests
      SET Status = ?, Notes = ?, ApprovedBy = ?, CompletedDate = COALESCE(?, CompletedDate), UpdatedAt = NOW()
      WHERE RequestID = ?
    `;
    
    await db.query(sql, [status, notes, approvedBy, completedDate, id]);
  }

  /**
   * Delete printing request
   */
  static async delete(id) {
    const sql = `DELETE FROM PrintingRequests WHERE RequestID = ?`;
    await db.query(sql, [id]);
  }

  /**
   * Calculate printing cost
   */
  static calculateCost(pageCount, color, copies) {
    const config = require('../../config');
    const costPerPage = color ? config.printing.costPerPageColor : config.printing.costPerPageBW;
    return pageCount * costPerPage * copies;
  }

  /**
   * Get user's printing requests
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
   * Get printing statistics
   */
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalRequests,
        COUNT(CASE WHEN Status = 'Pending' THEN 1 END) as pendingRequests,
        COUNT(CASE WHEN Status = 'Approved' THEN 1 END) as approvedRequests,
        COUNT(CASE WHEN Status = 'In Progress' THEN 1 END) as inProgressRequests,
        COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as completedRequests,
        COUNT(CASE WHEN Status = 'Rejected' THEN 1 END) as rejectedRequests,
        SUM(PageCount * Copies) as totalPages,
        SUM(CASE WHEN Status = 'Completed' THEN Cost ELSE 0 END) as totalRevenue
      FROM PrintingRequests
    `;
    
    const result = await db.query(sql);
    return result[0];
  }
}

module.exports = PrintingRequest;
