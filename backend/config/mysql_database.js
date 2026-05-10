const mysql = require('mysql2/promise');
require('dotenv').config();

class MySQLDatabase {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bugema_elibrary',
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
