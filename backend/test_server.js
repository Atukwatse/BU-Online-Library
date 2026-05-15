require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { initializeDatabase } = require('./sqlite_db.js');
const mysqlDb = require('./config/mysql_database');

const app = express();

// ─── Database Selection ───────────────────────────────────────────────────────
let db;
const useMySQL = !!process.env.DATABASE_URL;
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: true,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ─── JWT helper (simple mock) ─────────────────────────────────────────────────
const generateToken = (user) => `mock-jwt-${user.UserID}-${Date.now()}`;
const tokenStore = new Map(); // token → user

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'E-Library API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    let found = await db.get('SELECT * FROM Users WHERE Email = ? AND Password = ?', [email, password]);

    if (!found) {
      if (role === 'Staff') {
        // Auto-register staff if they select Staff
        const existingEmail = await db.get('SELECT * FROM Users WHERE Email = ?', [email]);
        if (existingEmail) {
          return res.status(401).json({ status: 'error', message: 'Invalid password for existing user' });
        }
        const result = await db.run('INSERT INTO Users (FullName, Email, Password, Role) VALUES (?, ?, ?, ?)', [email.split('@')[0], email, password, 'Staff']);
        found = await db.get('SELECT * FROM Users WHERE UserID = ?', [result.lastID]);
      } else {
        return res.status(401).json({ status: 'error', message: 'Invalid email or password. Please create an account first.' });
      }
    }

    const token = generateToken(found);
    const { Password: _, ...user } = found; // strip password
    tokenStore.set(token, user);

    return res.json({
      status: 'success',
      message: 'Login successful',
      data: { token, user }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { FullName, Email, Password, Role } = req.body;
    if (!FullName || !Email || !Password) {
      return res.status(400).json({ status: 'error', message: 'FullName, Email and Password are required' });
    }
    const existing = await db.get('SELECT * FROM Users WHERE Email = ?', [Email]);
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Email already registered' });
    }
    const result = await db.run('INSERT INTO Users (FullName, Email, Password, Role) VALUES (?, ?, ?, ?)', [FullName, Email, Password, Role || 'Student']);
    const newUser = await db.get('SELECT UserID, FullName, Email, Role, Status FROM Users WHERE UserID = ?', [result.lastID]);
    return res.status(201).json({ status: 'success', message: 'Account created. Please login.', data: newUser });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const auth = req.headers.authorization;
  if (auth) tokenStore.delete(auth.replace('Bearer ', ''));
  return res.json({ status: 'success', message: 'Logged out' });
});

app.get('/api/auth/profile', (req, res) => {
  const auth = req.headers.authorization;
  const token = auth ? auth.replace('Bearer ', '') : null;
  const user = token ? tokenStore.get(token) : null;
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  return res.json({ status: 'success', data: { user } });
});

// ─── Books Routes ─────────────────────────────────────────────────────────────
app.get('/api/books', async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = 'SELECT * FROM Books WHERE 1=1';
    let params = [];
    if (search) {
      query += ' AND (Title LIKE ? OR Author LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      query += ' AND Status = ?';
      params.push(status);
    }
    const books = await db.all(query, params);
    return res.json({ status: 'success', data: books, total: books.length });
  } catch (err) {
    console.error('Error in GET /api/books:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/books/featured', async (req, res) => {
  try {
    const books = await db.all('SELECT * FROM Books LIMIT 3');
    return res.json({ status: 'success', data: books });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/books/trending', async (req, res) => {
  try {
    const books = await db.all('SELECT * FROM Books LIMIT 4');
    return res.json({ status: 'success', data: books });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await db.get('SELECT * FROM Books WHERE BookID = ?', [parseInt(req.params.id)]);
    if (!book) return res.status(404).json({ status: 'error', message: 'Book not found' });
    return res.json({ status: 'success', data: book });
  } catch (err) {
    console.error('Error in GET /api/books/:id:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { Title, Author, Category, CoverImage, FileURL, Status } = req.body;
    const result = await db.run(
      'INSERT INTO Books (Title, Author, Category, CoverImage, FileURL, Status) VALUES (?, ?, ?, ?, ?, ?)',
      [Title, Author, Category, CoverImage, FileURL, Status || 'Available']
    );
    const newBook = await db.get('SELECT * FROM Books WHERE BookID = ?', [result.lastID]);
    res.status(201).json({ status: 'success', data: newBook });
  } catch (err) {
    console.error('Error in POST /api/books:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const { Title, Author, Category, CoverImage, FileURL, Status } = req.body;
    await db.run(
      'UPDATE Books SET Title = ?, Author = ?, Category = ?, CoverImage = ?, FileURL = ?, Status = ? WHERE BookID = ?',
      [Title, Author, Category, CoverImage, FileURL, Status, parseInt(req.params.id)]
    );
    const updatedBook = await db.get('SELECT * FROM Books WHERE BookID = ?', [parseInt(req.params.id)]);
    res.json({ status: 'success', data: updatedBook });
  } catch (err) {
    console.error('Error in PUT /api/books/:id:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM Books WHERE BookID = ?', [parseInt(req.params.id)]);
    res.json({ status: 'success', message: 'Book deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /api/books/:id:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── Borrowing Routes ─────────────────────────────────────────────────────────
app.get('/api/borrowing/requests', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM Requests';
    let params = [];
    if (status) {
      query += ' WHERE Status = ?';
      params.push(status);
    }
    const requests = await db.all(query, params);
    return res.json({ status: 'success', data: requests });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/borrowing/requests', async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await db.get('SELECT * FROM Books WHERE BookID = ?', [parseInt(bookId)]);
    if (!book) return res.status(404).json({ status: 'error', message: 'Book not found' });

    // Get user from token
    const auth = req.headers.authorization;
    const token = auth ? auth.replace('Bearer ', '') : null;
    const currentUser = token ? tokenStore.get(token) : null;
    const userName = currentUser?.FullName || 'Unknown User';
    const userEmail = currentUser?.Email || '';

    const result = await db.run(
      'INSERT INTO Requests (BookID, BookTitle, UserName, UserEmail, RequestDate, Status) VALUES (?, ?, ?, ?, ?, ?)',
      [book.BookID, book.Title, userName, userEmail, new Date().toISOString(), 'Pending']
    );

    const newRequest = await db.get('SELECT * FROM Requests WHERE RequestID = ?', [result.lastID]);
    return res.json({ status: 'success', data: newRequest });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get MY borrowing requests (for logged-in student)
app.get('/api/borrowing/my-requests', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const token = auth ? auth.replace('Bearer ', '') : null;
    const currentUser = token ? tokenStore.get(token) : null;
    if (!currentUser) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const requests = await db.all('SELECT * FROM Requests WHERE UserEmail = ? ORDER BY RequestDate DESC', [currentUser.Email]);
    return res.json({ status: 'success', data: requests });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.put('/api/borrowing/requests/:id/approve', async (req, res) => {
  try {
    await db.run('UPDATE Requests SET Status = ? WHERE RequestID = ?', ['Approved', parseInt(req.params.id)]);
    return res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.put('/api/borrowing/requests/:id/reject', async (req, res) => {
  try {
    await db.run('UPDATE Requests SET Status = ? WHERE RequestID = ?', ['Rejected', parseInt(req.params.id)]);
    return res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── Events Routes ────────────────────────────────────────────────────────────
app.get('/api/events', async (req, res) => {
  try {
    const events = await db.all('SELECT * FROM Events');
    return res.json({ status: 'success', data: events });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await db.get('SELECT * FROM Events WHERE EventID = ?', [parseInt(req.params.id)]);
    if (!event) return res.status(404).json({ status: 'error', message: 'Event not found' });
    return res.json({ status: 'success', data: event });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { Title, Description, EventDate, StartTime, EndTime, Location, MaxAttendees } = req.body;
    const result = await db.run(
      'INSERT INTO Events (Title, Description, EventDate, StartTime, EndTime, Location, MaxAttendees, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [Title, Description, EventDate, StartTime, EndTime, Location, MaxAttendees || 0, 'Active']
    );
    const newEvent = await db.get('SELECT * FROM Events WHERE EventID = ?', [result.lastID]);
    return res.status(201).json({ status: 'success', data: newEvent });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/events/:id/register', (req, res) => {
  return res.json({ status: 'success', message: 'Registered for event successfully' });
});

// ─── Service Requests ──────────────────────────────────────────────────────────
app.post('/api/services/requests', upload.single('file'), async (req, res) => {
  try {
    const { UserName, UserEmail, Type, Details, Room, StartTime, EndTime } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const result = await db.run(
      'INSERT INTO ServiceRequests (UserName, UserEmail, Type, Details, FileURL, Room, StartTime, EndTime, Status, CreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [UserName, UserEmail, Type, Details, fileUrl, Room || null, StartTime || null, EndTime || null, 'Pending', new Date().toISOString()]
    );
    res.status(201).json({ status: 'success', data: { id: result.lastID } });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

app.get('/api/services/requests', async (req, res) => {
  try {
    const requests = await db.all('SELECT * FROM ServiceRequests ORDER BY CreatedAt DESC');
    res.json({ status: 'success', data: requests });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// Update service request status (approve/reject)
app.put('/api/services/requests/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await db.run('UPDATE ServiceRequests SET Status = ? WHERE ID = ?', [status, req.params.id]);
    res.json({ status: 'success' });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// Get MY service requests (for logged-in student)
app.get('/api/services/my-requests', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const token = auth ? auth.replace('Bearer ', '') : null;
    const currentUser = token ? tokenStore.get(token) : null;
    if (!currentUser) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    const requests = await db.all('SELECT * FROM ServiceRequests WHERE UserEmail = ? ORDER BY CreatedAt DESC', [currentUser.Email]);
    res.json({ status: 'success', data: requests });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// ─── Reviews Routes ──────────────────────────────────────────────────────────
// GET all reviews (public)
app.get('/api/reviews', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM Reviews ORDER BY CreatedAt DESC');
    res.json({ status: 'success', data: rows });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// GET all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await db.all('SELECT * FROM Reviews ORDER BY CreatedAt DESC');
    res.json({ status: 'success', data: reviews });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// GET reviews for a specific service
app.get('/api/reviews/:service', async (req, res) => {
  try {
    const reviews = await db.all('SELECT * FROM Reviews WHERE Service = ? ORDER BY CreatedAt DESC', [req.params.service]);
    res.json({ status: 'success', data: reviews });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// POST a new review (anyone visiting a service page)
app.post('/api/reviews', async (req, res) => {
  try {
    const { rating, comment, service, userName, userEmail } = req.body;

    const auth = req.headers.authorization;
    const token = auth ? auth.replace('Bearer ', '') : null;
    const currentUser = token ? tokenStore.get(token) : null;

    const name = currentUser?.FullName || userName || 'Anonymous';
    const email = currentUser?.Email || userEmail || '';

    if (!rating || rating < 1 || rating > 5 || !service) {
      return res.status(400).json({ status: 'error', message: 'Rating (1-5) and service name are required' });
    }

    await db.run(
      'INSERT INTO Reviews (UserName, UserEmail, Rating, Comment, Service, CreatedAt) VALUES (?,?,?,?,?,?)',
      [name, email, rating, comment || '', service, new Date().toISOString()]
    );
    res.status(201).json({ status: 'success', message: 'Review saved. Thank you!' });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// DELETE a review (admin only)
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const token = auth ? auth.replace('Bearer ', '') : null;
    const currentUser = token ? tokenStore.get(token) : null;

    if (!currentUser || currentUser.Role?.toLowerCase() !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Access denied. Admins only.' });
    }

    const result = await db.run('DELETE FROM Reviews WHERE ReviewID = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ status: 'error', message: 'Review not found' });
    res.json({ status: 'success', message: 'Review deleted' });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// ─── Books Admin CRUD ────────────────────────────────────────────────────────
app.post('/api/books', async (req, res) => {
  try {
    const { Title, Author, Category, CoverImage } = req.body;
    const result = await db.run('INSERT INTO Books (Title, Author, Category, CoverImage, Status) VALUES (?, ?, ?, ?, ?)', [Title, Author, Category, CoverImage, 'Available']);
    const newBook = await db.get('SELECT * FROM Books WHERE BookID = ?', [result.lastID]);
    res.status(201).json({ status: 'success', data: newBook });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const { Title, Author, Category, CoverImage, Status } = req.body;
    await db.run('UPDATE Books SET Title=?, Author=?, Category=?, CoverImage=?, Status=? WHERE BookID=?', [Title, Author, Category, CoverImage, Status, req.params.id]);
    res.json({ status: 'success' });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM Books WHERE BookID=?', [req.params.id]);
    res.json({ status: 'success' });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// ─── Events Admin CRUD ───────────────────────────────────────────────────────
app.post('/api/events', async (req, res) => {
  try {
    const { Title, Description, EventDate, StartTime, EndTime, Location, MaxAttendees } = req.body;
    const result = await db.run('INSERT INTO Events (Title, Description, EventDate, StartTime, EndTime, Location, MaxAttendees, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [Title, Description, EventDate, StartTime, EndTime, Location, MaxAttendees || 100, 'Active']);
    const newEvent = await db.get('SELECT * FROM Events WHERE EventID = ?', [result.lastID]);
    res.status(201).json({ status: 'success', data: newEvent });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const { Title, Description, EventDate, StartTime, EndTime, Location, MaxAttendees, Status } = req.body;
    await db.run('UPDATE Events SET Title=?, Description=?, EventDate=?, StartTime=?, EndTime=?, Location=?, MaxAttendees=?, Status=? WHERE EventID=?',
      [Title, Description, EventDate, StartTime, EndTime, Location, MaxAttendees, Status, req.params.id]);
    res.json({ status: 'success' });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM Events WHERE EventID=?', [req.params.id]);
    res.json({ status: 'success' });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// ─── Manage Users ────────────────────────────────────────────────────────────
app.put('/api/admin/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await db.run('UPDATE Users SET Status=? WHERE UserID=?', [status, req.params.id]);
    res.json({ status: 'success' });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [books, users, events, activeUsers] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM Books'),
      db.get('SELECT COUNT(*) as count FROM Users'),
      db.get('SELECT COUNT(*) as count FROM Events'),
      db.get('SELECT COUNT(*) as count FROM Users WHERE Status = "Active"')
    ]);

    return res.json({
      status: 'success',
      data: {
        totalBooks: books.count,
        totalUsers: users.count,
        totalEvents: events.count,
        activeUsers: activeUsers.count,
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await db.all('SELECT UserID, FullName, Email, Role, Status FROM Users');
    return res.json({ status: 'success', data: users });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── User Routes ──────────────────────────────────────────────────────────────
app.get('/api/users/profile', (req, res) => {
  const auth = req.headers.authorization;
  const token = auth ? auth.replace('Bearer ', '') : null;
  const user = token ? tokenStore.get(token) : null;
  if (!user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  return res.json({ status: 'success', data: user });
});

// ─── Static files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// If root directory files are needed, serve them safely
if (process.env.SERVE_ROOT === 'true') {
  app.use(express.static(path.join(__dirname, '..')));
}

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found', path: req.originalUrl });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

const startApp = async () => {
  try {
    if (useMySQL) {
      console.log('🔗 Connecting to MySQL...');
      await mysqlDb.connect();
      await mysqlDb.initializeTables();
      db = mysqlDb;
    } else {
      console.log('📂 Using SQLite...');
      db = await initializeDatabase();
      // Ensure Reviews table exists in SQLite
      await db.exec(`
        CREATE TABLE IF NOT EXISTS Reviews (
          ReviewID INTEGER PRIMARY KEY AUTOINCREMENT,
          UserName TEXT NOT NULL,
          UserEmail TEXT,
          Rating INTEGER NOT NULL,
          Comment TEXT,
          Service TEXT NOT NULL,
          CreatedAt TEXT
        )
      `);
    }

    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log(`🚀 Bugema E-Library Backend Started (${useMySQL ? 'MySQL' : 'SQLite'})`);
      console.log('='.repeat(60));
      console.log(`🌐 Backend URL:  http://localhost:${PORT}`);
      console.log(`❤️  Health:       http://localhost:${PORT}/api/health`);
      console.log('='.repeat(60));
      if (useMySQL) {
        console.log('☁️  Database: Connected to Aiven MySQL');
      } else {
        console.log('💾 Database: Local SQLite file');
      }
      console.log('='.repeat(60));
      console.log(`🎨 Frontend (React): http://localhost:3000`);
      console.log('='.repeat(60));
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
};

startApp();

module.exports = app;
