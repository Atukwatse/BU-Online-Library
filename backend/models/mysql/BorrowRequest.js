/**
 * Borrow Request Model
 */

const db = require('../../config/mock_database');

class BorrowRequest {
  /**
   * Create a new borrow request
   */
  static async create(data) {
    const { userID, bookID, dueDate, notes } = data;
    
    const sql = `
      INSERT INTO BorrowRequests (UserID, BookID, DueDate, Notes, Status, RequestDate, CreatedAt)
      VALUES (?, ?, ?, ?, 'Pending', NOW(), NOW())
    `;
    
    const result = await db.query(sql, [userID, bookID, dueDate, notes]);
    return result.insertId;
  }

  /**
   * Find borrow request by ID
   */
  static async findById(id) {
    const sql = `
      SELECT br.*, u.FullName as UserName, u.Email as UserEmail, b.Title as BookTitle, b.Author as BookAuthor
      FROM BorrowRequests br
      JOIN Users u ON br.UserID = u.UserID
      JOIN Books b ON br.BookID = b.BookID
      WHERE br.RequestID = ?
    `;
    
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all borrow requests
   */
  static async findAll(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT br.*, u.FullName as UserName, b.Title as BookTitle
      FROM BorrowRequests br
      JOIN Users u ON br.UserID = u.UserID
      JOIN Books b ON br.BookID = b.BookID
      WHERE 1=1
    `;
    const params = [];

    if (filters.userID) {
      sql += ` AND br.UserID = ?`;
      params.push(filters.userID);
    }
    if (filters.status) {
      sql += ` AND br.Status = ?`;
      params.push(filters.status);
    }
    if (filters.bookID) {
      sql += ` AND br.BookID = ?`;
      params.push(filters.bookID);
    }

    sql += ` ORDER BY br.CreatedAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const data = await db.query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM BorrowRequests WHERE 1=1`;
    const countParams = [];
    if (filters.userID) {
      countSql += ` AND UserID = ?`;
      countParams.push(filters.userID);
    }
    if (filters.status) {
      countSql += ` AND Status = ?`;
      countParams.push(filters.status);
    }
    if (filters.bookID) {
      countSql += ` AND BookID = ?`;
      countParams.push(filters.bookID);
    }
    const countResult = await db.query(countSql, countParams);
    const total = countResult[0].total;

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /**
   * Update borrow request status
   */
  static async updateStatus(id, status, notes = null) {
    const sql = `
      UPDATE BorrowRequests
      SET Status = ?, Notes = ?, UpdatedAt = NOW()
      WHERE RequestID = ?
    `;
    
    await db.query(sql, [status, notes, id]);
  }

  /**
   * Approve borrow request
   */
  static async approve(id, approvedBy, notes = null) {
    const request = await this.findById(id);
    if (!request) {
      throw new Error('Borrow request not found');
    }

    await this.updateStatus(id, 'Approved', notes);

    // Create borrowing record
    await this.createBorrowing({
      userID: request.UserID,
      bookID: request.BookID,
      dueDate: request.DueDate,
      approvedBy,
    });

    // Update book availability
    await this.updateBookAvailability(request.BookID, -1);

    return { success: true };
  }

  /**
   * Reject borrow request
   */
  static async reject(id, rejectedBy, notes = null) {
    await this.updateStatus(id, 'Rejected', notes);
    return { success: true };
  }

  /**
   * Create borrowing record
   */
  static async createBorrowing(data) {
    const { userID, bookID, dueDate, approvedBy } = data;
    
    const sql = `
      INSERT INTO Borrowings (UserID, BookID, BorrowDate, DueDate, ApprovedBy, Status, CreatedAt)
      VALUES (?, ?, NOW(), ?, ?, 'Borrowed', NOW())
    `;
    
    const result = await db.query(sql, [userID, bookID, dueDate, approvedBy]);
    return result.insertId;
  }

  /**
   * Return book
   */
  static async returnBook(borrowingID, returnedBy, notes = null) {
    const sql = `
      UPDATE Borrowings
      SET Status = 'Returned',
          ReturnDate = NOW(),
          ReturnedBy = ?,
          Notes = ?,
          UpdatedAt = NOW()
      WHERE BorrowingID = ?
    `;
    
    await db.query(sql, [returnedBy, notes, borrowingID]);

    // Get borrowing details to update book availability
    const borrowing = await this.getBorrowingById(borrowingID);
    if (borrowing) {
      await this.updateBookAvailability(borrowing.BookID, 1);
    }

    return { success: true };
  }

  /**
   * Get borrowing by ID
   */
  static async getBorrowingById(id) {
    const sql = `
      SELECT * FROM Borrowings WHERE BorrowingID = ?
    `;
    
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Update book availability
   */
  static async updateBookAvailability(bookID, change) {
    const sql = `
      UPDATE Books
      SET AvailableCopies = AvailableCopies + ?,
          UpdatedAt = NOW()
      WHERE BookID = ?
    `;
    
    await db.query(sql, [change, bookID]);
  }

  /**
   * Get overdue borrowings
   */
  static async getOverdueBorrowings(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT b.*, u.FullName, u.Email, bo.Title as BookTitle
      FROM Borrowings b
      JOIN Users u ON b.UserID = u.UserID
      JOIN Books bo ON b.BookID = bo.BookID
      WHERE b.Status = 'Borrowed' AND b.DueDate < NOW()
      ORDER BY b.DueDate ASC
      LIMIT ? OFFSET ?
    `;
    
    return await db.query(sql, [limit, offset]);
  }

  /**
   * Get user's borrowing history
   */
  static async getUserBorrowingHistory(userID, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT b.*, bo.Title as BookTitle, bo.Author, bo.CoverImage
      FROM Borrowings b
      JOIN Books bo ON b.BookID = bo.BookID
      WHERE b.UserID = ?
      ORDER BY b.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    
    return await db.query(sql, [userID, limit, offset]);
  }

  /**
   * Calculate penalty for overdue book
   */
  static async calculatePenalty(borrowingID) {
    const borrowing = await this.getBorrowingById(borrowingID);
    if (!borrowing || borrowing.Status !== 'Borrowed') {
      return { penalty: 0, daysOverdue: 0 };
    }

    const dueDate = new Date(borrowing.DueDate);
    const now = new Date();
    const daysOverdue = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));
    
    // Penalty: $0.50 per day overdue
    const penalty = daysOverdue * 0.50;

    return { penalty, daysOverdue };
  }

  /**
   * Get pending requests for staff/admin
   */
  static async getPendingRequests(page = 1, limit = 20) {
    return await this.findAll({ status: 'Pending' }, page, limit);
  }

  /**
   * Get borrowing statistics
   */
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalBorrowings,
        COUNT(CASE WHEN Status = 'Borrowed' THEN 1 END) as activeBorrowings,
        COUNT(CASE WHEN Status = 'Returned' THEN 1 END) as returnedBorrowings,
        COUNT(CASE WHEN Status = 'Overdue' THEN 1 END) as overdueBorrowings,
        COUNT(CASE WHEN DueDate < NOW() AND Status = 'Borrowed' THEN 1 END) as currentlyOverdue
      FROM Borrowings
    `;
    
    const result = await db.query(sql);
    return result[0];
  }
}

module.exports = BorrowRequest;
