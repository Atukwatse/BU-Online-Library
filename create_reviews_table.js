const db = require('./backend/config/mysql_database');

async function createTable() {
  try {
    const connected = await db.connect();
    if (!connected) {
      console.log('Failed to connect to MySQL');
      process.exit(1);
    }
    await db.query(`
      CREATE TABLE IF NOT EXISTS Reviews (
        ReviewID INT AUTO_INCREMENT PRIMARY KEY,
        UserName VARCHAR(255) NOT NULL,
        UserEmail VARCHAR(255),
        Rating INT NOT NULL,
        Comment TEXT,
        Service VARCHAR(255) NOT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table Reviews created successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
createTable();
