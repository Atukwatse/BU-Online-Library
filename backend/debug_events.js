const mockDb = require('./config/mock_database');

async function debugEvents() {
  console.log('=== DEBUG EVENTS ===');
  
  // Check if events exist in mock database
  console.log('Events array length:', mockDb.events.length);
  console.log('First event:', mockDb.events[0]);
  
  // Test the query method
  try {
    const result = await mockDb.query(`
      SELECT e.*, u.FullName as OrganizerName,
        (SELECT COUNT(*) FROM EventRegistrations WHERE EventID = e.EventID) as RegisteredCount
      FROM Events e
      LEFT JOIN Users u ON e.OrganizerID = u.UserID
      WHERE 1=1
     ORDER BY e.EventDate DESC LIMIT ? OFFSET ?
    `, [20, 0]);
    
    console.log('Query result:', result);
    console.log('Query result length:', result.length);
  } catch (error) {
    console.error('Query error:', error);
  }
}

debugEvents();
