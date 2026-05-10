require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// Try to use MySQL database, fallback to mock if not available
let db;
try {
  db = require('./config/mysql_database');
} catch (error) {
  console.log('⚠️  MySQL not available, using mock database');
  db = require('./config/mock_database');
}
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Import MySQL-based routes
const authRoutes = require('./routes/mysql/authRoutes');
const bookRoutes = require('./routes/mysql/bookRoutes');
const userRoutes = require('./routes/mysql/userRoutes');
const downloadRoutes = require('./routes/mysql/downloadRoutes');
const categoryRoutes = require('./routes/mysql/categoryRoutes');
const roleBasedAuthRoutes = require('./routes/mysql/roleBasedAuthRoutes');
const eventRoutes = require('./routes/mysql/eventRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const borrowingRoutes = require('./routes/mysql/borrowingRoutes');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbHealthy = await db.healthCheck();
    const stats = await db.getStats();
    
    res.status(200).json({
      status: 'success',
      message: 'E-library API is running',
      database: dbHealthy ? 'connected' : 'disconnected',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Database statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get statistics',
      error: error.message,
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', roleBasedAuthRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/borrow', borrowingRoutes);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..')));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    const connected = await db.connect();
    if (connected) {
      console.log(`✅ Database Connected`);
    } else {
      console.log(`⚠️  Using Mock Database (MySQL not available)`);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${connected ? 'MySQL' : 'Mock'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await db.close();
  process.exit(0);
});

startServer();
