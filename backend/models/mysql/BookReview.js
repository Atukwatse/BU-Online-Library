/**
 * Book Review Model
 */

const db = require('../../config/mysql_database');

class BookReview {
  /**
   * Create a new review
   */
  static async create(data) {
    const { bookID, userID, review, rating } = data;
    
    const sql = `
      INSERT INTO BookReviews (BookID, UserID, Review, Rating, IsApproved, CreatedAt)
      VALUES (?, ?, ?, ?, 0, NOW())
    `;
    
    const result = await db.query(sql, [bookID, userID, review, rating]);
    return result.insertId;
  }

  /**
   * Find review by ID
   */
  static async findById(id) {
    const sql = `
      SELECT br.*, u.FullName, u.Email
      FROM BookReviews br
      JOIN Users u ON br.UserID = u.UserID
      WHERE br.ReviewID = ?
    `;
    
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all reviews for a book
   */
  static async findByBook(bookID, page = 1, limit = 20, includeUnapproved = false) {
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT br.*, u.FullName, u.Email
      FROM BookReviews br
      JOIN Users u ON br.UserID = u.UserID
      WHERE br.BookID = ?
    `;
    
    if (!includeUnapproved) {
      sql += ` AND br.IsApproved = 1`;
    }
    
    sql += ` ORDER BY br.CreatedAt DESC LIMIT ? OFFSET ?`;
    
    return await db.query(sql, [bookID, limit, offset]);
  }

  /**
   * Get pending reviews (for admin approval)
   */
  static async getPendingReviews(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT br.*, u.FullName, u.Email, b.Title as BookTitle
      FROM BookReviews br
      JOIN Users u ON br.UserID = u.UserID
      JOIN Books b ON br.BookID = b.BookID
      WHERE br.IsApproved = 0
      ORDER BY br.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    
    return await db.query(sql, [limit, offset]);
  }

  /**
   * Approve review
   */
  static async approve(id) {
    const sql = `
      UPDATE BookReviews
      SET IsApproved = 1
      WHERE ReviewID = ?
    `;
    
    await db.query(sql, [id]);
  }

  /**
   * Reject review
   */
  static async reject(id) {
    const sql = `DELETE FROM BookReviews WHERE ReviewID = ?`;
    await db.query(sql, [id]);
  }

  /**
   * Update review
   */
  static async update(id, data) {
    const { review, rating } = data;
    
    const sql = `
      UPDATE BookReviews
      SET Review = ?, Rating = ?, UpdatedAt = NOW()
      WHERE ReviewID = ?
    `;
    
    await db.query(sql, [review, rating, id]);
  }

  /**
   * Delete review
   */
  static async delete(id) {
    const sql = `DELETE FROM BookReviews WHERE ReviewID = ?`;
    await db.query(sql, [id]);
  }

  /**
   * Get user's reviews
   */
  static async findByUser(userID, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT br.*, b.Title, b.Author, b.CoverImage
      FROM BookReviews br
      JOIN Books b ON br.BookID = b.BookID
      WHERE br.UserID = ?
      ORDER BY br.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    
    return await db.query(sql, [userID, limit, offset]);
  }

  /**
   * Get review statistics
   */
  static async getStats(bookID) {
    const sql = `
      SELECT 
        COUNT(*) as totalReviews,
        COUNT(CASE WHEN IsApproved = 1 THEN 1 END) as approvedReviews,
        COUNT(CASE WHEN IsApproved = 0 THEN 1 END) as pendingReviews,
        AVG(Rating) as averageRating
      FROM BookReviews
      WHERE BookID = ?
    `;
    
    const result = await db.query(sql, [bookID]);
    return result[0];
  }
}

module.exports = BookReview;
