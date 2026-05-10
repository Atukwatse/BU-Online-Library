const mysql = require('mysql2/promise');
require('dotenv').config();

class MySQLDatabase {
  constructor() {
    const connectionConfig = process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bugema_elibrary',
    };

    this.pool = mysql.createPool(typeof connectionConfig === 'string' ? connectionConfig : {
      ...connectionConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
    this.isMock = false;
    this.mockDb = null;
  }

  async connect() {
    try {
      const connection = await this.pool.getConnection();
      console.log(`MySQL Connected: ${connection.config.host}:${connection.config.port}/${connection.config.database}`);
      connection.release();
      this.isMock = false;
      return true;
    } catch (error) {
      console.error('MySQL Connection Error:', error.message);
      this.isMock = true;
      this.mockDb = require('./mock_database');
      return false;
    }
  }

  async query(sql, params = []) {
    if (this.isMock && this.mockDb) {
      return this.mockDb.query(sql, params);
    }
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Query Error:', error.message);
      throw error;
    }
  }

  async transaction(callback) {
    if (this.isMock && this.mockDb) {
      // Mock transaction just executes the callback with mockDb
      return callback(this.mockDb);
    }
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async close() {
    if (this.isMock && this.mockDb) {
      return this.mockDb.close();
    }
    await this.pool.end();
    console.log('MySQL Connection Closed');
  }

  // SQLite-compatible wrappers for easier transition
  async get(sql, params = []) {
    const results = await this.query(sql, params);
    return results[0] || null;
  }

  async all(sql, params = []) {
    return this.query(sql, params);
  }

  async run(sql, params = []) {
    const [result] = await this.pool.execute(sql, params);
    return { lastID: result.insertId, changes: result.affectedRows };
  }

  async exec(sql) {
    return this.query(sql);
  }

  async initializeTables() {
    console.log('📦 Initializing MySQL Tables...');
    
    // Users Table
    await this.query(`
      CREATE TABLE IF NOT EXISTS Users (
        UserID INT AUTO_INCREMENT PRIMARY KEY,
        FullName VARCHAR(255) NOT NULL,
        Email VARCHAR(255) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        Role VARCHAR(50) DEFAULT 'Student',
        Status VARCHAR(50) DEFAULT 'Active'
      )
    `);

    // Books Table
    await this.query(`
      CREATE TABLE IF NOT EXISTS Books (
        BookID INT AUTO_INCREMENT PRIMARY KEY,
        Title VARCHAR(255) NOT NULL,
        Author VARCHAR(255) NOT NULL,
        Category VARCHAR(255) NOT NULL,
        Status VARCHAR(50) DEFAULT 'Available',
        CoverImage TEXT,
        FileURL TEXT
      )
    `);

    // Events Table
    await this.query(`
      CREATE TABLE IF NOT EXISTS Events (
        EventID INT AUTO_INCREMENT PRIMARY KEY,
        Title VARCHAR(255) NOT NULL,
        Description TEXT,
        EventDate VARCHAR(50),
        StartTime VARCHAR(50),
        EndTime VARCHAR(50),
        Location VARCHAR(255),
        MaxAttendees INT,
        Status VARCHAR(50) DEFAULT 'Active'
      )
    `);

    // Requests Table
    await this.query(`
      CREATE TABLE IF NOT EXISTS Requests (
        RequestID INT AUTO_INCREMENT PRIMARY KEY,
        BookID INT,
        BookTitle VARCHAR(255),
        UserName VARCHAR(255),
        UserEmail VARCHAR(255),
        RequestDate VARCHAR(50),
        Status VARCHAR(50) DEFAULT 'Pending'
      )
    `);

    // Service Requests Table
    await this.query(`
      CREATE TABLE IF NOT EXISTS ServiceRequests (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        UserName VARCHAR(255),
        UserEmail VARCHAR(255),
        Type VARCHAR(100) NOT NULL,
        Details TEXT,
        FileURL TEXT,
        Room VARCHAR(255),
        StartTime VARCHAR(50),
        EndTime VARCHAR(50),
        Status VARCHAR(50) DEFAULT 'Pending',
        CreatedAt VARCHAR(50)
      )
    `);

    // Reviews Table
    await this.query(`
      CREATE TABLE IF NOT EXISTS Reviews (
        ReviewID INT AUTO_INCREMENT PRIMARY KEY,
        UserName VARCHAR(255) NOT NULL,
        UserEmail VARCHAR(255),
        Rating INT NOT NULL,
        Comment TEXT,
        Service VARCHAR(255) NOT NULL,
        CreatedAt VARCHAR(50)
      )
    `);

    console.log('✅ MySQL Tables Ready');

    // Seed Data if empty
    const users = await this.query('SELECT COUNT(*) as total FROM Users');
    if (users[0].total <= 3) { // Seed if only the 3 basic users exist or less
      console.log('🌱 Seeding Users...');
      await this.query('INSERT IGNORE INTO Users (FullName, Email, Password, Role) VALUES (?, ?, ?, ?)', ['Admin User', 'admin@gmail.com', 'admin123', 'Admin']);
      await this.query('INSERT IGNORE INTO Users (FullName, Email, Password, Role) VALUES (?, ?, ?, ?)', ['Staff User', 'staff@bugema.ac.ug', 'staff123', 'Staff']);
      await this.query('INSERT IGNORE INTO Users (FullName, Email, Password, Role) VALUES (?, ?, ?, ?)', ['Student User', 'student@bugema.ac.ug', 'student123', 'Student']);
    }

    const books = await this.query('SELECT COUNT(*) as total FROM Books');
    if (books[0].total <= 3) {
      console.log('🌱 Seeding more Books...');
      await this.query('INSERT IGNORE INTO Books (Title, Author, Category, Status) VALUES (?, ?, ?, ?)', ['African History & Heritage', 'Grace Nakato', 'History', 'Available']);
      await this.query('INSERT IGNORE INTO Books (Title, Author, Category, Status) VALUES (?, ?, ?, ?)', ['Biology: Life Sciences', 'Peter Opio', 'Science', 'Available']);
      await this.query('INSERT IGNORE INTO Books (Title, Author, Category, Status) VALUES (?, ?, ?, ?)', ['Research Methods', 'Mary Akello', 'Education', 'Available']);
    }

    const events = await this.query('SELECT COUNT(*) as total FROM Events');
    if (events[0].total === 0) {
      console.log('🌱 Seeding Events...');
      await this.query('INSERT INTO Events (Title, Description, EventDate, StartTime, EndTime, Location, Status) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        ['Library Orientation', 'New student introduction', '2026-05-15', '10:00', '12:00', 'Main Hall', 'Active']);
      await this.query('INSERT INTO Events (Title, Description, EventDate, StartTime, EndTime, Location, Status) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        ['Research Seminar', 'Advanced search techniques', '2026-05-20', '14:00', '16:00', 'Room 101', 'Active']);
    }
  }

  // Health check
  async healthCheck() {
    if (this.isMock && this.mockDb) {
      return this.mockDb.healthCheck();
    }
    try {
      const result = await this.query('SELECT 1 as health');
      return result[0].health === 1;
    } catch (error) {
      return false;
    }
  }

  // Get database stats
  async getStats() {
    if (this.isMock && this.mockDb) {
      return this.mockDb.getStats();
    }
    try {
      const [userStats] = await this.query('SELECT COUNT(*) as total FROM Users');
      const [bookStats] = await this.query('SELECT COUNT(*) as total FROM Books');
      const [downloadStats] = await this.query('SELECT COUNT(*) as total FROM Downloads');
      const [categoryStats] = await this.query('SELECT COUNT(*) as total FROM Categories');

      return {
        users: userStats[0].total,
        books: bookStats[0].total,
        downloads: downloadStats[0].total,
        categories: categoryStats[0].total,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }
}

const db = new MySQLDatabase();

module.exports = db;
