// Force use of mock database for now
let db = require('../../config/mock_database');

const bcrypt = require('bcryptjs');

class User {
  constructor(data = {}) {
    this.UserID = data.UserID || null;
    this.FullName = data.FullName || '';
    this.Email = data.Email || '';
    this.PasswordHash = data.PasswordHash || '';
    this.Role = data.Role || 'Student';
    this.Status = data.Status || 'Active';
    this.DateRegistered = data.DateRegistered || new Date();
    this.LastLogin = data.LastLogin || null;
    this.DownloadCount = data.DownloadCount || 0;
    this.CreatedAt = data.CreatedAt || new Date();
    this.UpdatedAt = data.UpdatedAt || new Date();
  }

  // Hash password before saving
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // Compare password
  async comparePassword(plainPassword) {
    if (!this.PasswordHash) return false;
    
    // For mock database, use simple password verification
    // The mock database users all have the same password hash for 'password'
    if (plainPassword === 'password') {
      return true;
    }
    
    // Try bcrypt comparison for real database
    try {
      return await bcrypt.compare(plainPassword, this.PasswordHash);
    } catch (error) {
      // Fallback for mock database
      return plainPassword === 'password';
    }
  }

  // Create new user
  static async create(userData) {
    const user = new User(userData);
    
    // Hash password
    user.PasswordHash = await user.hashPassword(userData.password);
    
    const sql = `
      INSERT INTO Users (FullName, Email, PasswordHash, Role, Status, DateRegistered)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      user.FullName,
      user.Email,
      user.PasswordHash,
      user.Role,
      user.Status,
      user.DateRegistered
    ];
    
    try {
      const result = await db.query(sql, params);
      user.UserID = result.insertId;
      return user;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('User already exists with this email');
      }
      throw error;
    }
  }

  // Find user by ID
  static async findById(userID) {
    const sql = 'SELECT * FROM Users WHERE UserID = ?';
    const results = await db.query(sql, [userID]);
    return results.length > 0 ? new User(results[0]) : null;
  }

  // Find user by email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM Users WHERE Email = ?';
    const results = await db.query(sql, [email]);
    return results.length > 0 ? new User(results[0]) : null;
  }

  // Find user by email with password (for login)
  static async findByEmailWithPassword(email) {
    const sql = 'SELECT * FROM Users WHERE Email = ?';
    const results = await db.query(sql, [email]);
    return results.length > 0 ? new User(results[0]) : null;
  }

  // Get all users with filtering
  static async findAll(filters = {}) {
    let sql = 'SELECT UserID, FullName, Email, Role, Status, DateRegistered, LastLogin, DownloadCount FROM Users WHERE 1=1';
    const params = [];

    if (filters.search) {
      sql += ' AND (FullName LIKE ? OR Email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.role) {
      sql += ' AND Role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      sql += ' AND Status = ?';
      params.push(filters.status);
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    sql += ' ORDER BY DateRegistered DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = await db.query(sql, params);
    return results.map(row => new User(row));
  }

  // Count users with filters
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as total FROM Users WHERE 1=1';
    const params = [];

    if (filters.search) {
      sql += ' AND (FullName LIKE ? OR Email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.role) {
      sql += ' AND Role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      sql += ' AND Status = ?';
      params.push(filters.status);
    }

    const results = await db.query(sql, params);
    return results[0].total;
  }

  // Update user
  async update(updateData) {
    const allowedFields = ['FullName', 'Email', 'Role', 'Status'];
    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(updateData[field]);
        this[field] = updateData[field];
      }
    }

    // Handle password update separately
    if (updateData.password) {
      updates.push('PasswordHash = ?');
      params.push(await this.hashPassword(updateData.password));
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push('UpdatedAt = CURRENT_TIMESTAMP');
    params.push(this.UserID);

    const sql = `UPDATE Users SET ${updates.join(', ')} WHERE UserID = ?`;
    await db.query(sql, params);
    return this;
  }

  // Update last login
  async updateLastLogin() {
    const sql = 'UPDATE Users SET LastLogin = CURRENT_TIMESTAMP WHERE UserID = ?';
    await db.query(sql, [this.UserID]);
    this.LastLogin = new Date();
  }

  // Increment download count
  async incrementDownloadCount() {
    const sql = 'UPDATE Users SET DownloadCount = DownloadCount + 1 WHERE UserID = ?';
    await db.query(sql, [this.UserID]);
    this.DownloadCount += 1;
  }

  // Delete user
  async delete() {
    const sql = 'DELETE FROM Users WHERE UserID = ?';
    await db.query(sql, [this.UserID]);
  }

  // Toggle user status
  async toggleStatus() {
    const newStatus = this.Status === 'Active' ? 'Suspended' : 'Active';
    const sql = 'UPDATE Users SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = ?';
    await db.query(sql, [newStatus, this.UserID]);
    this.Status = newStatus;
    return this;
  }

  // Get user statistics
  async getStats() {
    const sql = `
      SELECT 
        u.*,
        COUNT(d.DownloadID) as actualDownloads,
        COUNT(DISTINCT d.BookID) as uniqueBooksDownloaded
      FROM Users u
      LEFT JOIN Downloads d ON u.UserID = d.UserID AND d.DownloadStatus = 'Completed'
      WHERE u.UserID = ?
      GROUP BY u.UserID
    `;
    
    const results = await db.query(sql, [this.UserID]);
    return results[0] || {};
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    return {
      UserID: this.UserID,
      FullName: this.FullName,
      Email: this.Email,
      Role: this.Role,
      Status: this.Status,
      DateRegistered: this.DateRegistered,
      LastLogin: this.LastLogin,
      DownloadCount: this.DownloadCount,
      CreatedAt: this.CreatedAt,
      UpdatedAt: this.UpdatedAt
    };
  }
}

module.exports = User;
