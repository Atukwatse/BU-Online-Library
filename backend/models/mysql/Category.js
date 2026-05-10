// Try to use MySQL database, fallback to mock if not available
let db;
try {
  db = require('../../config/mysql_database');
} catch (error) {
  console.log('⚠️  MySQL not available, using mock database');
  db = require('../../config/mock_database');
}

class Category {
  constructor(data = {}) {
    this.CategoryID = data.CategoryID || null;
    this.Name = data.Name || '';
    this.Description = data.Description || null;
    this.CreatedAt = data.CreatedAt || new Date();
    this.UpdatedAt = data.UpdatedAt || new Date();
  }

  // Create new category
  static async create(categoryData) {
    const category = new Category(categoryData);
    
    const sql = `
      INSERT INTO Categories (Name, Description)
      VALUES (?, ?)
    `;
    
    const params = [category.Name, category.Description];
    
    try {
      const result = await db.query(sql, params);
      category.CategoryID = result.insertId;
      return category;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Category already exists with this name');
      }
      throw error;
    }
  }

  // Find category by ID
  static async findById(categoryID) {
    const sql = 'SELECT * FROM Categories WHERE CategoryID = ?';
    const results = await db.query(sql, [categoryID]);
    return results.length > 0 ? new Category(results[0]) : null;
  }

  // Find category by name
  static async findByName(name) {
    const sql = 'SELECT * FROM Categories WHERE Name = ?';
    const results = await db.query(sql, [name]);
    return results.length > 0 ? new Category(results[0]) : null;
  }

  // Get all categories
  static async findAll() {
    const sql = `
      SELECT c.*, COUNT(b.BookID) as bookCount
      FROM Categories c
      LEFT JOIN Books b ON c.CategoryID = b.CategoryID
      GROUP BY c.CategoryID
      ORDER BY c.Name
    `;
    
    const results = await db.query(sql);
    return results.map(row => new Category(row));
  }

  // Get categories with book counts
  static async getWithBookCounts() {
    const sql = `
      SELECT 
        c.CategoryID,
        c.Name,
        c.Description,
        COUNT(b.BookID) as totalBooks,
        COUNT(CASE WHEN b.Status = 'Available' THEN 1 END) as availableBooks,
        SUM(b.DownloadCount) as totalDownloads
      FROM Categories c
      LEFT JOIN Books b ON c.CategoryID = b.CategoryID
      GROUP BY c.CategoryID
      ORDER BY c.Name
    `;
    
    const results = await db.query(sql);
    return results.map(row => new Category(row));
  }

  // Update category
  async update(updateData) {
    const allowedFields = ['Name', 'Description'];
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
    params.push(this.CategoryID);

    const sql = `UPDATE Categories SET ${updates.join(', ')} WHERE CategoryID = ?`;
    await db.query(sql, params);
    return this;
  }

  // Delete category (check if books exist)
  async delete() {
    // Check if there are books in this category
    const bookCountSql = 'SELECT COUNT(*) as count FROM Books WHERE CategoryID = ?';
    const bookResults = await db.query(bookCountSql, [this.CategoryID]);
    
    if (bookResults[0].count > 0) {
      throw new Error('Cannot delete category that contains books');
    }

    const sql = 'DELETE FROM Categories WHERE CategoryID = ?';
    await db.query(sql, [this.CategoryID]);
  }

  // Get popular categories
  static async getPopularCategories(limit = 10) {
    const sql = `
      SELECT 
        c.CategoryID,
        c.Name,
        c.Description,
        COUNT(b.BookID) as bookCount,
        SUM(b.DownloadCount) as totalDownloads
      FROM Categories c
      LEFT JOIN Books b ON c.CategoryID = b.CategoryID AND b.Status = 'Available'
      GROUP BY c.CategoryID
      HAVING bookCount > 0
      ORDER BY totalDownloads DESC, bookCount DESC
      LIMIT ?
    `;
    
    const results = await db.query(sql, [limit]);
    return results.map(row => new Category(row));
  }

  // Search categories
  static async search(searchTerm) {
    const sql = `
      SELECT c.*, COUNT(b.BookID) as bookCount
      FROM Categories c
      LEFT JOIN Books b ON c.CategoryID = b.CategoryID
      WHERE c.Name LIKE ? OR c.Description LIKE ?
      GROUP BY c.CategoryID
      ORDER BY c.Name
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const results = await db.query(sql, [searchPattern, searchPattern]);
    return results.map(row => new Category(row));
  }

  // Convert to JSON
  toJSON() {
    return {
      CategoryID: this.CategoryID,
      Name: this.Name,
      Description: this.Description,
      CreatedAt: this.CreatedAt,
      UpdatedAt: this.UpdatedAt
    };
  }
}

module.exports = Category;
