// Try to use MySQL database, fallback to mock if not available
let db;
try {
  db = require('../../config/mysql_database');
} catch (error) {
  console.log('⚠️  MySQL not available, using mock database');
  db = require('../../config/mock_database');
}

class Download {
  constructor(data = {}) {
    this.DownloadID = data.DownloadID || null;
    this.UserID = data.UserID || null;
    this.BookID = data.BookID || null;
    this.DownloadDate = data.DownloadDate || new Date();
    this.IPAddress = data.IPAddress || null;
    this.UserAgent = data.UserAgent || null;
    this.DownloadStatus = data.DownloadStatus || 'Completed';
    this.FileSize = data.FileSize || null;
    this.CreatedAt = data.CreatedAt || new Date();
  }

  // Create new download record
  static async create(downloadData) {
    const download = new Download(downloadData);
    
    const sql = `
      INSERT INTO Downloads (UserID, BookID, DownloadDate, IPAddress, UserAgent, DownloadStatus, FileSize)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      download.UserID,
      download.BookID,
      download.DownloadDate,
      download.IPAddress,
      download.UserAgent,
      download.DownloadStatus,
      download.FileSize
    ];
    
    try {
      const result = await db.query(sql, params);
      download.DownloadID = result.insertId;
      
      // Update book download count
      await db.query('UPDATE Books SET DownloadCount = DownloadCount + 1 WHERE BookID = ?', [download.BookID]);
      
      // Update user download count
      await db.query('UPDATE Users SET DownloadCount = DownloadCount + 1 WHERE UserID = ?', [download.UserID]);
      
      return download;
    } catch (error) {
      throw error;
    }
  }

  // Find download by ID
  static async findById(downloadID) {
    const sql = `
      SELECT d.*, u.FullName, u.Email, b.Title, b.Author
      FROM Downloads d
      JOIN Users u ON d.UserID = u.UserID
      JOIN Books b ON d.BookID = b.BookID
      WHERE d.DownloadID = ?
    `;
    
    const results = await db.query(sql, [downloadID]);
    return results.length > 0 ? new Download(results[0]) : null;
  }

  // Get downloads by user
  static async findByUser(userID, filters = {}) {
    let sql = `
      SELECT d.*, b.Title, b.Author, c.Name as CategoryName
      FROM Downloads d
      JOIN Books b ON d.BookID = b.BookID
      LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
      WHERE d.UserID = ? AND d.DownloadStatus = 'Completed'
    `;
    const params = [userID];

    // Date range filter
    if (filters.dateFrom) {
      sql += ' AND d.DownloadDate >= ?';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      sql += ' AND d.DownloadDate <= ?';
      params.push(filters.dateTo);
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    sql += ' ORDER BY d.DownloadDate DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = await db.query(sql, params);
    return results.map(row => new Download(row));
  }

  // Get downloads by book
  static async findByBook(bookID, filters = {}) {
    let sql = `
      SELECT d.*, u.FullName, u.Email
      FROM Downloads d
      JOIN Users u ON d.UserID = u.UserID
      WHERE d.BookID = ? AND d.DownloadStatus = 'Completed'
    `;
    const params = [bookID];

    // Date range filter
    if (filters.dateFrom) {
      sql += ' AND d.DownloadDate >= ?';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      sql += ' AND d.DownloadDate <= ?';
      params.push(filters.dateTo);
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    sql += ' ORDER BY d.DownloadDate DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = await db.query(sql, params);
    return results.map(row => new Download(row));
  }

  // Get download statistics
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalDownloads,
        COUNT(CASE WHEN DownloadStatus = 'Completed' THEN 1 END) as completedDownloads,
        COUNT(CASE WHEN DownloadStatus = 'Failed' THEN 1 END) as failedDownloads,
        COUNT(DISTINCT UserID) as uniqueUsers,
        COUNT(DISTINCT BookID) as uniqueBooks,
        AVG(FileSize) as avgFileSize,
        SUM(FileSize) as totalFileSize
      FROM Downloads
    `;
    
    const results = await db.query(sql);
    return results[0];
  }

  // Get monthly download statistics
  static async getMonthlyStats(months = 12) {
    const sql = `
      SELECT 
        DATE_FORMAT(DownloadDate, '%Y-%m') as month,
        COUNT(*) as downloads,
        COUNT(DISTINCT UserID) as uniqueUsers,
        COUNT(DISTINCT BookID) as uniqueBooks
      FROM Downloads 
      WHERE DownloadStatus = 'Completed'
        AND DownloadDate >= DATE_SUB(CURRENT_DATE, INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(DownloadDate, '%Y-%m')
      ORDER BY month DESC
    `;
    
    const results = await db.query(sql, [months]);
    return results;
  }

  // Get popular books by downloads
  static async getPopularBooks(limit = 10, days = 30) {
    const sql = `
      SELECT 
        b.BookID,
        b.Title,
        b.Author,
        c.Name as Category,
        COUNT(d.DownloadID) as downloadCount,
        COUNT(DISTINCT d.UserID) as uniqueDownloaders
      FROM Downloads d
      JOIN Books b ON d.BookID = b.BookID
      LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
      WHERE d.DownloadStatus = 'Completed'
        AND d.DownloadDate >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY b.BookID
      ORDER BY downloadCount DESC
      LIMIT ?
    `;
    
    const results = await db.query(sql, [days, limit]);
    return results;
  }

  // Get active users by downloads
  static async getActiveUsers(limit = 10, days = 30) {
    const sql = `
      SELECT 
        u.UserID,
        u.FullName,
        u.Email,
        COUNT(d.DownloadID) as downloadCount,
        COUNT(DISTINCT d.BookID) as uniqueBooks
      FROM Downloads d
      JOIN Users u ON d.UserID = u.UserID
      WHERE d.DownloadStatus = 'Completed'
        AND d.DownloadDate >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY u.UserID
      ORDER BY downloadCount DESC
      LIMIT ?
    `;
    
    const results = await db.query(sql, [days, limit]);
    return results;
  }

  // Check if user has already downloaded book
  static async hasUserDownloadedBook(userID, bookID) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM Downloads 
      WHERE UserID = ? AND BookID = ? AND DownloadStatus = 'Completed'
    `;
    
    const results = await db.query(sql, [userID, bookID]);
    return results[0].count > 0;
  }

  // Get user's download history with details
  static async getUserDownloadHistory(userID, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT 
        d.DownloadID,
        d.DownloadDate,
        d.IPAddress,
        d.FileSize,
        b.BookID,
        b.Title,
        b.Author,
        c.Name as CategoryName
      FROM Downloads d
      JOIN Books b ON d.BookID = b.BookID
      LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
      WHERE d.UserID = ? AND d.DownloadStatus = 'Completed'
      ORDER BY d.DownloadDate DESC
      LIMIT ? OFFSET ?
    `;
    
    const results = await db.query(sql, [userID, limit, offset]);
    
    // Get total count
    const countSql = 'SELECT COUNT(*) as total FROM Downloads WHERE UserID = ? AND DownloadStatus = "Completed"';
    const countResults = await db.query(countSql, [userID]);
    
    return {
      downloads: results.map(row => new Download(row)),
      total: countResults[0].total,
      page,
      totalPages: Math.ceil(countResults[0].total / limit)
    };
  }

  // Get recent downloads for admin dashboard
  static async getRecentDownloads(limit = 20) {
    const sql = `
      SELECT 
        d.DownloadID,
        d.DownloadDate,
        d.IPAddress,
        u.FullName as UserName,
        u.Email as UserEmail,
        b.Title as BookTitle,
        b.Author as BookAuthor
      FROM Downloads d
      JOIN Users u ON d.UserID = u.UserID
      JOIN Books b ON d.BookID = b.BookID
      WHERE d.DownloadStatus = 'Completed'
      ORDER BY d.DownloadDate DESC
      LIMIT ?
    `;
    
    const results = await db.query(sql, [limit]);
    return results.map(row => new Download(row));
  }

  // Update download status
  async updateStatus(status) {
    const sql = 'UPDATE Downloads SET DownloadStatus = ? WHERE DownloadID = ?';
    await db.query(sql, [status, this.DownloadID]);
    this.DownloadStatus = status;
    return this;
  }

  // Convert to JSON
  toJSON() {
    return {
      DownloadID: this.DownloadID,
      UserID: this.UserID,
      BookID: this.BookID,
      DownloadDate: this.DownloadDate,
      IPAddress: this.IPAddress,
      UserAgent: this.UserAgent,
      DownloadStatus: this.DownloadStatus,
      FileSize: this.FileSize,
      CreatedAt: this.CreatedAt
    };
  }
}

module.exports = Download;
