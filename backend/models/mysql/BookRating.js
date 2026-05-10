/**
 * Book Rating Model
 */

const db = require('../../config/mysql_database');

class BookRating {
  /**
   * Create a new rating
   */
  static async create(data) {
    const { bookID, userID, rating, review } = data;
    
    const sql = `
      INSERT INTO BookRatings (BookID, UserID, Rating, Review, CreatedAt)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        Rating = VALUES(Rating),
        Review = VALUES(Review),
        UpdatedAt = NOW()
    `;
    
    const result = await db.query(sql, [bookID, userID, rating, review]);
    return result.insertId || result.affectedRows;
  }

  /**
   * Find rating by book and user
   */
  static async findByBookAndUser(bookID, userID) {
    const sql = `
      SELECT * FROM BookRatings
      WHERE BookID = ? AND UserID = ?
    `;
    
    const results = await db.query(sql, [bookID, userID]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all ratings for a book
   */
  static async findByBook(bookID, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT br.*, u.FullName, u.Email
      FROM BookRatings br
      JOIN Users u ON br.UserID = u.UserID
      WHERE br.BookID = ?
      ORDER BY br.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    
    return await db.query(sql, [bookID, limit, offset]);
  }

  /**
   * Get average rating for a book
   */
  static async getAverageRating(bookID) {
    const sql = `
      SELECT 
        AVG(Rating) as averageRating,
        COUNT(*) as totalRatings,
        COUNT(CASE WHEN Rating = 5 THEN 1 END) as fiveStar,
        COUNT(CASE WHEN Rating = 4 THEN 1 END) as fourStar,
        COUNT(CASE WHEN Rating = 3 THEN 1 END) as threeStar,
        COUNT(CASE WHEN Rating = 2 THEN 1 END) as twoStar,
        COUNT(CASE WHEN Rating = 1 THEN 1 END) as oneStar
      FROM BookRatings
      WHERE BookID = ?
    `;
    
    const result = await db.query(sql, [bookID]);
    return result[0];
  }

  /**
   * Update rating
   */
  static async update(id, data) {
    const { rating, review } = data;
    
    const sql = `
      UPDATE BookRatings
      SET Rating = ?, Review = ?, UpdatedAt = NOW()
      WHERE RatingID = ?
    `;
    
    await db.query(sql, [rating, review, id]);
  }

  /**
   * Delete rating
   */
  static async delete(id) {
    const sql = `DELETE FROM BookRatings WHERE RatingID = ?`;
    await db.query(sql, [id]);
  }

  /**
   * Get user's ratings
   */
  static async findByUser(userID, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT br.*, b.Title, b.Author, b.CoverImage
      FROM BookRatings br
      JOIN Books b ON br.BookID = b.BookID
      WHERE br.UserID = ?
      ORDER BY br.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    
    return await db.query(sql, [userID, limit, offset]);
  }

  /**
   * Get top rated books
   */
  static async getTopRatedBooks(limit = 10) {
    const sql = `
      SELECT 
        b.*,
        AVG(br.Rating) as averageRating,
        COUNT(br.Rating) as totalRatings
      FROM Books b
      JOIN BookRatings br ON b.BookID = br.BookID
      WHERE b.Status = 'Available'
      GROUP BY b.BookID
      HAVING totalRatings >= 3
      ORDER BY averageRating DESC, totalRatings DESC
      LIMIT ?
    `;
    
    return await db.query(sql, [limit]);
  }
}

module.exports = BookRating;
