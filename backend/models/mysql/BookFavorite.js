/**
 * Book Favorite Model
 */

const db = require('../../config/mysql_database');

class BookFavorite {
  /**
   * Add book to favorites
   */
  static async create(data) {
    const { bookID, userID } = data;
    
    const sql = `
      INSERT INTO BookFavorites (BookID, UserID, CreatedAt)
      VALUES (?, ?, NOW())
    `;
    
    const result = await db.query(sql, [bookID, userID]);
    return result.insertId;
  }

  /**
   * Check if book is in user's favorites
   */
  static async isFavorite(bookID, userID) {
    const sql = `
      SELECT * FROM BookFavorites
      WHERE BookID = ? AND UserID = ?
    `;
    
    const results = await db.query(sql, [bookID, userID]);
    return results.length > 0;
  }

  /**
   * Remove book from favorites
   */
  static async delete(bookID, userID) {
    const sql = `
      DELETE FROM BookFavorites
      WHERE BookID = ? AND UserID = ?
    `;
    
    await db.query(sql, [bookID, userID]);
  }

  /**
   * Get all favorites for a user
   */
  static async findByUser(userID, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT b.*, bf.CreatedAt as FavoritedAt
      FROM BookFavorites bf
      JOIN Books b ON bf.BookID = b.BookID
      WHERE bf.UserID = ?
      ORDER BY bf.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    
    return await db.query(sql, [userID, limit, offset]);
  }

  /**
   * Get favorite count for a book
   */
  static async getFavoriteCount(bookID) {
    const sql = `
      SELECT COUNT(*) as count FROM BookFavorites WHERE BookID = ?
    `;
    
    const result = await db.query(sql, [bookID]);
    return result[0].count;
  }

  /**
   * Get most favorited books
   */
  static async getMostFavoritedBooks(limit = 10) {
    const sql = `
      SELECT 
        b.*,
        COUNT(bf.FavoriteID) as favoriteCount
      FROM Books b
      JOIN BookFavorites bf ON b.BookID = bf.BookID
      WHERE b.Status = 'Available'
      GROUP BY b.BookID
      ORDER BY favoriteCount DESC
      LIMIT ?
    `;
    
    return await db.query(sql, [limit]);
  }

  /**
   * Toggle favorite status
   */
  static async toggle(bookID, userID) {
    const isFavorite = await this.isFavorite(bookID, userID);
    
    if (isFavorite) {
      await this.delete(bookID, userID);
      return { favorited: false };
    } else {
      await this.create({ bookID, userID });
      return { favorited: true };
    }
  }
}

module.exports = BookFavorite;
