// Force use of mock database for now
let db = require('../../config/mock_database');

class Book {
  constructor(data = {}) {
    this.BookID = data.BookID || null;
    this.Title = data.Title || '';
    this.Author = data.Author || '';
    this.ISBN = data.ISBN || null;
    this.CategoryID = data.CategoryID || null;
    this.Year = data.Year || null;
    this.FilePath = data.FilePath || null;
    this.CoverImagePath = data.CoverImagePath || null;
    this.Status = data.Status || 'Available';
    this.DateAdded = data.DateAdded || new Date();
    this.FileSize = data.FileSize || null;
    this.Description = data.Description || null;
    this.DownloadCount = data.DownloadCount || 0;
    this.CreatedAt = data.CreatedAt || new Date();
    this.UpdatedAt = data.UpdatedAt || new Date();
  }

  // Create new book
  static async create(bookData) {
    const book = new Book(bookData);
    
    const sql = `
      INSERT INTO Books (Title, Author, ISBN, CategoryID, Year, FilePath, CoverImagePath, Status, DateAdded, FileSize, Description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      book.Title,
      book.Author,
      book.ISBN,
      book.CategoryID,
      book.Year,
      book.FilePath,
      book.CoverImagePath,
      book.Status,
      book.DateAdded,
      book.FileSize,
      book.Description
    ];
    
    try {
      const result = await db.query(sql, params);
      book.BookID = result.insertId;
      return book;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Book with this ISBN already exists');
      }
      throw error;
    }
  }

  // Find book by ID
  static async findById(bookID) {
    const sql = `
      SELECT b.*, c.Name as CategoryName 
      FROM Books b
      LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
      WHERE b.BookID = ?
    `;
    
    const results = await db.query(sql, [bookID]);
    return results.length > 0 ? new Book(results[0]) : null;
  }

  // Get all books with filtering and pagination
  static async findAll(filters = {}) {
    let sql = `
      SELECT b.*, c.Name as CategoryName 
      FROM Books b
      LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
      WHERE 1=1
    `;
    const params = [];

    // Search functionality
    if (filters.search) {
      sql += ' AND (b.Title LIKE ? OR b.Author LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Category filter
    if (filters.category) {
      sql += ' AND b.CategoryID = ?';
      params.push(filters.category);
    }

    // Status filter
    if (filters.status) {
      sql += ' AND b.Status = ?';
      params.push(filters.status);
    }

    // Year filter
    if (filters.year) {
      sql += ' AND b.Year = ?';
      params.push(filters.year);
    }

    // Only show available books to non-admin users
    if (filters.onlyAvailable) {
      sql += ' AND b.Status = "Available"';
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    sql += ' ORDER BY b.DateAdded DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = await db.query(sql, params);
    return results.map(row => new Book(row));
  }

  // Count books with filters
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as total FROM Books b WHERE 1=1';
    const params = [];

    if (filters.search) {
      sql += ' AND (b.Title LIKE ? OR b.Author LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.category) {
      sql += ' AND b.CategoryID = ?';
      params.push(filters.category);
    }

    if (filters.status) {
      sql += ' AND b.Status = ?';
      params.push(filters.status);
    }

    if (filters.year) {
      sql += ' AND b.Year = ?';
      params.push(filters.year);
    }

    if (filters.onlyAvailable) {
      sql += ' AND b.Status = "Available"';
    }

    const results = await db.query(sql, params);
    return results[0].total;
  }

  // Update book
  async update(updateData) {
    const allowedFields = ['Title', 'Author', 'ISBN', 'CategoryID', 'Year', 'FilePath', 'CoverImagePath', 'Status', 'Description'];
    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(updateData[field]);
        this[field] = updateData[field];
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push('UpdatedAt = CURRENT_TIMESTAMP');
    params.push(this.BookID);

    const sql = `UPDATE Books SET ${updates.join(', ')} WHERE BookID = ?`;
    await db.query(sql, params);
    return this;
  }

  // Delete book
  async delete() {
    const sql = 'DELETE FROM Books WHERE BookID = ?';
    await db.query(sql, [this.BookID]);
  }

  // Update download count
  async incrementDownloadCount() {
    const sql = 'UPDATE Books SET DownloadCount = DownloadCount + 1 WHERE BookID = ?';
    await db.query(sql, [this.BookID]);
    this.DownloadCount += 1;
  }

  // Get book statistics
  async getStats() {
    const sql = `
      SELECT 
        b.*,
        c.Name as CategoryName,
        COUNT(d.DownloadID) as actualDownloads,
        AVG(r.Rating) as averageRating,
        COUNT(rv.ReviewID) as reviewCount
      FROM Books b
      LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
      LEFT JOIN Downloads d ON b.BookID = d.BookID AND d.DownloadStatus = 'Completed'
      LEFT JOIN BookRatings r ON b.BookID = r.BookID
      LEFT JOIN BookReviews rv ON b.BookID = rv.BookID AND rv.Status = 'Approved'
      WHERE b.BookID = ?
      GROUP BY b.BookID
    `;
    
    const results = await db.query(sql, [this.BookID]);
    return results[0] || {};
  }

  // Get popular books
  static async getPopularBooks(limit = 10) {
    const sql = `
      SELECT 
        b.BookID,
        b.Title,
        b.Author,
        c.Name as Category,
        b.DownloadCount,
        AVG(r.Rating) as AverageRating,
        COUNT(rv.ReviewID) as ReviewCount
      FROM Books b
      LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
      LEFT JOIN BookRatings r ON b.BookID = r.BookID
      LEFT JOIN BookReviews rv ON b.BookID = rv.BookID AND rv.Status = 'Approved'
      WHERE b.Status = 'Available'
      GROUP BY b.BookID, b.Title, b.Author, c.Name
      ORDER BY b.DownloadCount DESC, AverageRating DESC
      LIMIT ?
    `;
    
    const results = await db.query(sql, [limit]);
    return results.map(row => new Book(row));
  }

  // Get books by category
  static async findByCategory(categoryID, limit = 20) {
    const sql = `
      SELECT b.*, c.Name as CategoryName 
      FROM Books b
      LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
      WHERE b.CategoryID = ? AND b.Status = 'Available'
      ORDER BY b.DownloadCount DESC, b.DateAdded DESC
      LIMIT ?
    `;
    
    const results = await db.query(sql, [categoryID, limit]);
    return results.map(row => new Book(row));
  }

  // Search books with advanced filters
  static async advancedSearch(searchOptions) {
    let sql = `
      SELECT b.*, c.Name as CategoryName 
      FROM Books b
      LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
      WHERE 1=1
    `;
    const params = [];

    // Title search
    if (searchOptions.title) {
      sql += ' AND b.Title LIKE ?';
      params.push(`%${searchOptions.title}%`);
    }

    // Author search
    if (searchOptions.author) {
      sql += ' AND b.Author LIKE ?';
      params.push(`%${searchOptions.author}%`);
    }

    // Category filter
    if (searchOptions.categoryID) {
      sql += ' AND b.CategoryID = ?';
      params.push(searchOptions.categoryID);
    }

    // Year range
    if (searchOptions.yearFrom) {
      sql += ' AND b.Year >= ?';
      params.push(searchOptions.yearFrom);
    }
    if (searchOptions.yearTo) {
      sql += ' AND b.Year <= ?';
      params.push(searchOptions.yearTo);
    }

    // Status filter
    sql += ' AND b.Status = ?';
    params.push(searchOptions.status || 'Available');

    // Sorting
    const sortBy = searchOptions.sortBy || 'DateAdded';
    const sortOrder = searchOptions.sortOrder || 'DESC';
    sql += ` ORDER BY b.${sortBy} ${sortOrder}`;

    // Pagination
    const page = parseInt(searchOptions.page) || 1;
    const limit = parseInt(searchOptions.limit) || 10;
    const offset = (page - 1) * limit;

    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = await db.query(sql, params);
    return results.map(row => new Book(row));
  }

  // Convert to JSON
  toJSON() {
    return {
      BookID: this.BookID,
      Title: this.Title,
      Author: this.Author,
      ISBN: this.ISBN,
      CategoryID: this.CategoryID,
      Year: this.Year,
      FilePath: this.FilePath,
      CoverImagePath: this.CoverImagePath,
      Status: this.Status,
      DateAdded: this.DateAdded,
      FileSize: this.FileSize,
      Description: this.Description,
      DownloadCount: this.DownloadCount,
      CreatedAt: this.CreatedAt,
      UpdatedAt: this.UpdatedAt
    };
  }
}

module.exports = Book;
