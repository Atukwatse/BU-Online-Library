const path = require('path')

// Only require sqlite3 when actually using SQLite (not in production with MySQL)
let sqlite3, open;
try {
  if (!process.env.DATABASE_URL) {
    sqlite3 = require('sqlite3').verbose()
    open = require('sqlite').open
  }
} catch (error) {
  console.log('⚠️  Could not load sqlite3. This is expected in production if using MySQL.');
}

async function initializeDatabase() {
  if (!sqlite3 || !open) {
    throw new Error('SQLite modules are not available. Please ensure you are using MySQL in this environment.')
  }

  const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  // Create Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      UserID INTEGER PRIMARY KEY AUTOINCREMENT,
      FullName TEXT NOT NULL,
      Email TEXT UNIQUE NOT NULL,
      Password TEXT NOT NULL,
      Role TEXT DEFAULT 'Student',
      Status TEXT DEFAULT 'Active'
    )
  `)

  // Create Books Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Books (
      BookID INTEGER PRIMARY KEY AUTOINCREMENT,
      Title TEXT NOT NULL,
      Author TEXT NOT NULL,
      Category TEXT NOT NULL,
      Status TEXT DEFAULT 'Available',
      CoverImage TEXT,
      FileURL TEXT
    )
  `)

  // Create Events Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Events (
      EventID INTEGER PRIMARY KEY AUTOINCREMENT,
      Title TEXT NOT NULL,
      Description TEXT,
      EventDate TEXT,
      StartTime TEXT,
      EndTime TEXT,
      Location TEXT,
      MaxAttendees INTEGER,
      Status TEXT DEFAULT 'Active'
    )
  `)

  // Create Requests Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Requests (
      RequestID INTEGER PRIMARY KEY AUTOINCREMENT,
      BookID INTEGER,
      BookTitle TEXT,
      UserName TEXT,
      UserEmail TEXT,
      RequestDate TEXT,
      Status TEXT DEFAULT 'Pending'
    )
  `)

  // Create Service Requests Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ServiceRequests (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      UserName TEXT,
      UserEmail TEXT,
      Type TEXT NOT NULL,
      Details TEXT,
      FileURL TEXT,
      Room TEXT,
      StartTime TEXT,
      EndTime TEXT,
      Status TEXT DEFAULT 'Pending',
      CreatedAt TEXT
    )
  `)

  // Migration: add study room columns if they don't exist yet
  const cols = await db.all("PRAGMA table_info(ServiceRequests)")
  const colNames = cols.map(c => c.name)
  if (!colNames.includes('Room')) {
    await db.exec('ALTER TABLE ServiceRequests ADD COLUMN Room TEXT')
  }
  if (!colNames.includes('StartTime')) {
    await db.exec('ALTER TABLE ServiceRequests ADD COLUMN StartTime TEXT')
  }
  if (!colNames.includes('EndTime')) {
    await db.exec('ALTER TABLE ServiceRequests ADD COLUMN EndTime TEXT')
  }

  // Migration: add FileURL to Books if not exists
  const bookCols = await db.all("PRAGMA table_info(Books)")
  const bookColNames = bookCols.map(c => c.name)
  if (!bookColNames.includes('FileURL')) {
    await db.exec('ALTER TABLE Books ADD COLUMN FileURL TEXT')
  }

  // Migration: add UserEmail to Requests if not exists
  const reqCols = await db.all("PRAGMA table_info(Requests)")
  const reqColNames = reqCols.map(c => c.name)
  if (!reqColNames.includes('UserEmail')) {
    await db.exec('ALTER TABLE Requests ADD COLUMN UserEmail TEXT')
  }

  // Seed Data if empty
  const userCount = await db.get('SELECT COUNT(*) as count FROM Users')
  if (userCount.count === 0) {
    for (const u of MOCK_USERS) {
      await db.run('INSERT INTO Users (FullName, Email, Password, Role, Status) VALUES (?, ?, ?, ?, ?)', [u.FullName, u.Email, u.Password, u.Role, u.Status])
    }
  }

  const bookCount = await db.get('SELECT COUNT(*) as count FROM Books')
  if (bookCount.count === 0) {
    for (const b of MOCK_BOOKS) {
      await db.run('INSERT INTO Books (Title, Author, Category, Status) VALUES (?, ?, ?, ?)', [b.Title, b.Author, b.Category, b.Status])
    }
  }

  const eventCount = await db.get('SELECT COUNT(*) as count FROM Events')
  if (eventCount.count === 0) {
    for (const e of MOCK_EVENTS) {
      await db.run('INSERT INTO Events (Title, Description, EventDate, StartTime, EndTime, Location, MaxAttendees, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [e.Title, e.Description, e.EventDate, e.StartTime, e.EndTime, e.Location, e.MaxAttendees, e.Status])
    }
  }

  return db
}

module.exports = { initializeDatabase }
