const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const path = require('path')

const MOCK_USERS = [
  { FullName: 'Admin User', Email: 'admin@gmail.com', Password: 'admin123', Role: 'Admin', Status: 'Active' },
  { FullName: 'Staff User', Email: 'staff@bugema.ac.ug', Password: 'staff123', Role: 'Staff', Status: 'Active' },
  { FullName: 'Student User', Email: 'student@bugema.ac.ug', Password: 'student123', Role: 'Student', Status: 'Active' }
]

const MOCK_BOOKS = [
  { Title: 'Introduction to Computer Science', Author: 'John Smith', Category: 'Technology', Status: 'Available' },
  { Title: 'Advanced Mathematics', Author: 'Jane Doe', Category: 'Mathematics', Status: 'Available' },
  { Title: 'Principles of Economics', Author: 'Robert Brown', Category: 'Economics', Status: 'Available' },
  { Title: 'African History & Heritage', Author: 'Grace Nakato', Category: 'History', Status: 'Available' },
  { Title: 'Biology: Life Sciences', Author: 'Peter Opio', Category: 'Science', Status: 'Unavailable' },
  { Title: 'Research Methods in Education', Author: 'Mary Akello', Category: 'Education', Status: 'Available' }
]

const MOCK_EVENTS = [
  { Title: 'Research Workshop 2026', Description: 'Learn advanced research techniques', EventDate: '2026-05-20', StartTime: '09:00', EndTime: '13:00', Location: 'Main Library Hall', MaxAttendees: 100, Status: 'Active' },
  { Title: 'Digital Library Orientation', Description: 'Introduction to e-library resources', EventDate: '2026-05-25', StartTime: '14:00', EndTime: '16:00', Location: 'Computer Lab 2', MaxAttendees: 50, Status: 'Active' },
  { Title: 'Citation Management Seminar', Description: 'Zotero and Mendeley training session', EventDate: '2026-06-03', StartTime: '10:00', EndTime: '12:00', Location: 'Lecture Hall B', MaxAttendees: 80, Status: 'Active' }
]

async function initializeDatabase() {
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
