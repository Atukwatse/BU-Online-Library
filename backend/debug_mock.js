const mockDb = require('./config/mock_database');

async function debugMock() {
  console.log('=== DEBUG MOCK DATABASE ===');
  
  // Test direct access to books
  console.log('Books array length:', mockDb.books.length);
  console.log('First book:', mockDb.books[0]);
  
  // Test the query method
  try {
    const result = await mockDb.query(`
      SELECT b.*, c.Name as CategoryName
      FROM Books b
      LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
      WHERE 1=1
      AND b.Status = "Available" ORDER BY b.DateAdded DESC LIMIT ? OFFSET ?
    `, [10, 0]);
    
    console.log('Query result:', result);
    console.log('Query result length:', result.length);
  } catch (error) {
    console.error('Query error:', error);
  }
}

debugMock();
