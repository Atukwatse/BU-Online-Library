/**
 * Refresh Token Model
 * Stores refresh tokens for JWT token rotation
 */

const db = require('../../config/mysql_database');

class RefreshToken {
  /**
   * Create a new refresh token
   */
  static async create(data) {
    const { userId, token, expiresAt, ipAddress, userAgent } = data;
    
    const sql = `
      INSERT INTO RefreshTokens (UserID, Token, ExpiresAt, IPAddress, UserAgent, CreatedAt, IsRevoked)
      VALUES (?, ?, ?, ?, ?, NOW(), 0)
    `;
    
    const result = await db.query(sql, [userId, token, expiresAt, ipAddress, userAgent]);
    return result.insertId;
  }

  /**
   * Find refresh token by token hash
   */
  static async findByToken(token) {
    const sql = `
      SELECT * FROM RefreshTokens
      WHERE Token = ? AND IsRevoked = 0 AND ExpiresAt > NOW()
    `;
    
    const results = await db.query(sql, [token]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all active refresh tokens for a user
   */
  static async findByUserId(userId) {
    const sql = `
      SELECT * FROM RefreshTokens
      WHERE UserID = ? AND IsRevoked = 0 AND ExpiresAt > NOW()
      ORDER BY CreatedAt DESC
    `;
    
    return await db.query(sql, [userId]);
  }

  /**
   * Revoke a refresh token
   */
  static async revoke(token) {
    const sql = `
      UPDATE RefreshTokens
      SET IsRevoked = 1, RevokedAt = NOW()
      WHERE Token = ?
    `;
    
    await db.query(sql, [token]);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  static async revokeAllForUser(userId) {
    const sql = `
      UPDATE RefreshTokens
      SET IsRevoked = 1, RevokedAt = NOW()
      WHERE UserID = ? AND IsRevoked = 0
    `;
    
    await db.query(sql, [userId]);
  }

  /**
   * Revoke all refresh tokens except the current one (for token rotation)
   */
  static async revokeAllExcept(userId, currentToken) {
    const sql = `
      UPDATE RefreshTokens
      SET IsRevoked = 1, RevokedAt = NOW()
      WHERE UserID = ? AND Token != ? AND IsRevoked = 0
    `;
    
    await db.query(sql, [userId, currentToken]);
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpired() {
    const sql = `
      DELETE FROM RefreshTokens
      WHERE ExpiresAt < NOW() OR (IsRevoked = 1 AND RevokedAt < DATE_SUB(NOW(), INTERVAL 30 DAY))
    `;
    
    await db.query(sql);
  }

  /**
   * Get count of active tokens for a user
   */
  static async getActiveCount(userId) {
    const sql = `
      SELECT COUNT(*) as count FROM RefreshTokens
      WHERE UserID = ? AND IsRevoked = 0 AND ExpiresAt > NOW()
    `;
    
    const result = await db.query(sql, [userId]);
    return result[0].count;
  }
}

module.exports = RefreshToken;
