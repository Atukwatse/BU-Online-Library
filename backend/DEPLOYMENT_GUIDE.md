# 🚀 Bugema E-Library Database Deployment Guide

## 📋 Overview

This guide provides step-by-step instructions for deploying the optimized MySQL database schema and updating the backend to use the new structure.

---

## 🎯 Prerequisites

### System Requirements
- **Node.js** >= 18.0.0
- **MySQL** >= 8.0
- **NPM** >= 8.0.0
- **Git** (for version control)

### Database Requirements
- MySQL server installed and running
- Root access or user with CREATE/DROP privileges
- At least 1GB free disk space

---

## 🗄️ Step 1: Database Deployment

### 1.1 Backup Existing Database (if applicable)

```bash
# Navigate to backend directory
cd backend

# Create backup directory
mkdir -p backups

# Backup existing database (if it exists)
mysqldump -u root -p bugema_elibrary > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### 1.2 Deploy Optimized Schema

```bash
# Run the deployment script
npm run deploy:database

# Or manually execute SQL files:
mysql -u root -p < database_schema_optimized.sql
mysql -u root -p < database_migration.sql
```

### 1.3 Verify Deployment

```bash
# Check if tables were created
mysql -u root -p -e "SHOW TABLES FROM bugema_elibrary;"

# Check table structure
mysql -u root -p -e "DESCRIBE Users; DESCRIBE Books; DESCRIBE Categories; DESCRIBE Downloads;"
```

---

## ⚙️ Step 2: Environment Configuration

### 2.1 Update Environment Variables

Create or update `.env` file:

```env
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bugema_elibrary
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Configuration
JWT_SECRET=bugema-elibrary-secret-key-2024-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads/books
COVERS_PATH=./uploads/covers

# AI Cover Generation (OpenAI API)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=dall-e-3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 2.2 Install Dependencies

```bash
# Install all dependencies including MySQL
npm install

# Or install specific MySQL dependencies
npm install mysql2
```

---

## 🔧 Step 3: Update Backend Code

### 3.1 Switch to MySQL Server

The backend now supports both MongoDB and MySQL. To use MySQL:

```bash
# Start MySQL server
npm start

# Or for development
npm run dev

# To use MongoDB instead
npm run start:mongodb
npm run dev:mongodb
```

### 3.2 Key Changes Made

#### New Models Structure
```
models/mysql/
├── User.js          # User management with MySQL
├── Book.js          # Book management with MySQL
├── Category.js      # Category management with MySQL
└── Download.js      # Download tracking with MySQL
```

#### New Controllers Structure
```
controllers/mysql/
├── authController.js
├── bookController.js
├── userController.js
└── (other controllers)
```

#### New Routes Structure
```
routes/mysql/
├── authRoutes.js
├── bookRoutes.js
├── userRoutes.js
├── downloadRoutes.js
└── categoryRoutes.js
```

---

## 🧪 Step 4: API Testing

### 4.1 Run Automated Tests

```bash
# Test all API endpoints
npm run test:api

# This will test:
# - User registration and login
# - Book CRUD operations
# - Download tracking
# - Error handling
# - Performance benchmarks
```

### 4.2 Manual Testing

#### Health Check
```bash
curl http://localhost:5000/api/health
```

#### User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "Student"
  }'
```

#### User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 📊 Step 5: Performance Monitoring

### 5.1 Run Performance Analysis

```bash
# Monitor database performance
npm run monitor:performance

# This will analyze:
# - Query performance
# - Index usage
# - Table sizes
# - Connection counts
# - Fragmentation
```

### 5.2 Key Performance Metrics

- **Query Response Time**: < 1000ms for all queries
- **Connection Usage**: < 80% of max connections
- **Table Fragmentation**: < 10% for all tables
- **Index Hit Rate**: > 95%

---

## 🔍 Step 6: Validation

### 6.1 Database Validation

```sql
-- Check table structure
SHOW CREATE TABLE Users;
SHOW CREATE TABLE Books;
SHOW CREATE TABLE Categories;
SHOW CREATE TABLE Downloads;

-- Check foreign key constraints
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'bugema_elibrary'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Check indexes
SHOW INDEX FROM Users;
SHOW INDEX FROM Books;
SHOW INDEX FROM Categories;
SHOW INDEX FROM Downloads;
```

### 6.2 Data Validation

```sql
-- Check sample data
SELECT COUNT(*) as user_count FROM Users;
SELECT COUNT(*) as book_count FROM Books;
SELECT COUNT(*) as category_count FROM Categories;
SELECT COUNT(*) as download_count FROM Downloads;

-- Check relationships
SELECT 
  u.UserID,
  u.FullName,
  COUNT(d.DownloadID) as download_count
FROM Users u
LEFT JOIN Downloads d ON u.UserID = d.UserID
GROUP BY u.UserID
LIMIT 10;
```

---

## 🚨 Step 7: Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check MySQL service status
sudo systemctl status mysql

# Start MySQL service
sudo systemctl start mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

#### Permission Issues
```sql
-- Create database user with proper permissions
CREATE USER 'elibrary_app'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON bugema_elibrary.* TO 'elibrary_app'@'localhost';
FLUSH PRIVILEGES;
```

#### Port Conflicts
```bash
# Check what's running on port 5000
lsof -i :5000

# Kill process if needed
kill -9 <PID>
```

#### Missing Tables
```bash
# Re-run schema deployment
mysql -u root -p < database_schema_optimized.sql
```

---

## 📈 Step 8: Production Optimization

### 8.1 MySQL Configuration

Add to `/etc/mysql/my.cnf`:

```ini
[mysqld]
# Performance settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connection settings
max_connections = 100
max_connect_errors = 1000

# Query cache
query_cache_type = 1
query_cache_size = 64M

# Slow query log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1
```

### 8.2 Application Optimization

```bash
# Enable production mode
export NODE_ENV=production

# Use PM2 for process management
npm install -g pm2
pm2 start server_mysql.js --name "elibrary-api"
```

---

## 🔄 Step 9: Maintenance

### 9.1 Regular Tasks

```bash
# Weekly database optimization
mysql -u root -p -e "OPTIMIZE TABLE Users, Books, Categories, Downloads;"

# Monthly performance monitoring
npm run monitor:performance

# Quarterly backup verification
ls -la backups/
```

### 9.2 Monitoring Scripts

Create cron jobs:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/mysqldump -u root -p bugema_elibrary > /backups/daily_$(date +\%Y\%m\%d).sql

# Add weekly performance check
0 3 * * 0 cd /path/to/backend && npm run monitor:performance
```

---

## ✅ Step 10: Go-Live Checklist

### Pre-Launch Checklist
- [ ] Database schema deployed successfully
- [ ] All tables created with proper constraints
- [ ] Foreign key relationships verified
- [ ] Indexes created and working
- [ ] Sample data inserted
- [ ] Environment variables configured
- [ ] Backend server starts without errors
- [ ] All API endpoints tested
- [ ] Performance benchmarks met
- [ ] Backup procedures in place

### Post-Launch Monitoring
- [ ] Server health checks passing
- [ ] Database connection stable
- [ ] API response times < 1000ms
- [ ] Error rates < 1%
- [ ] User registration working
- [ ] Book uploads/downloads working
- [ ] Performance metrics within thresholds

---

## 📞 Support

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review the error logs in the console
3. Verify MySQL service is running
4. Check database permissions
5. Validate environment variables

For additional support, refer to the `database_audit_report.md` for detailed technical information.

---

## 🎉 Success!

Once you've completed all steps, your Bugema E-Library system will be running with:

- ✅ Optimized MySQL database with proper normalization
- ✅ Enhanced security and performance
- ✅ Complete API functionality
- ✅ Comprehensive monitoring and logging
- ✅ Production-ready configuration

The system is now ready for production use!
