/**
 * Environment-based Configuration
 * Loads configuration based on NODE_ENV
 */

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 5000,
    host: process.env.HOST || 'localhost',
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'bugema_elibrary',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    charset: 'utf8mb4',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    accessExpire: process.env.JWT_ACCESS_EXPIRE || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    maxCoverSize: parseInt(process.env.MAX_COVER_SIZE) || 5242880, // 5MB
    bookPath: process.env.UPLOAD_PATH || './uploads/books',
    coverPath: process.env.COVERS_PATH || './uploads/covers',
    eventBannerPath: process.env.EVENT_BANNER_PATH || './uploads/events',
    researchPath: process.env.RESEARCH_PATH || './uploads/research',
    printingPath: process.env.PRINTING_PATH || './uploads/printing',
    allowedFileTypes: ['application/pdf'],
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 900000, // 15 minutes
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 5,
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logDir: process.env.LOG_DIR || './logs',
  },

  // Email Configuration (for future implementation)
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@bugema.ac.ug',
  },

  // Redis Configuration (for future implementation)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
  },

  // OpenAI Configuration (for cover generation)
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'dall-e-3',
  },

  // Pagination Defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },

  // Account Lockout Configuration
  accountLockout: {
    maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MS) || 900000, // 15 minutes
  },

  // Token Configuration
  token: {
    passwordResetExpiry: parseInt(process.env.PASSWORD_RESET_EXPIRY_MS) || 3600000, // 1 hour
    emailVerificationExpiry: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY_MS) || 86400000, // 24 hours
    otpExpiry: parseInt(process.env.OTP_EXPIRY_MS) || 300000, // 5 minutes
  },

  // Printing Service Configuration
  printing: {
    costPerPageColor: parseFloat(process.env.COST_PER_PAGE_COLOR) || 0.50,
    costPerPageBW: parseFloat(process.env.COST_PER_PAGE_BW) || 0.10,
    maxPagesPerRequest: parseInt(process.env.MAX_PAGES_PER_REQUEST) || 100,
  },
};

// Environment-specific overrides
if (config.env === 'production') {
  config.logging.level = 'warn';
  config.rateLimit.maxRequests = 50;
  config.rateLimit.authMaxRequests = 3;
} else if (config.env === 'test') {
  config.database.name = process.env.DB_TEST_NAME || 'bugema_elibrary_test';
  config.logging.level = 'error';
}

// Validate required configuration in production
if (config.env === 'production') {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = config;
