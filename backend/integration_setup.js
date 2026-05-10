#!/usr/bin/env node

/**
 * Complete Integration Setup for Bugema E-Library
 * This script connects backend, frontend, database, and authentication
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class IntegrationSetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.backendDir = path.join(this.projectRoot, 'backend');
    this.frontendDir = this.projectRoot;
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    const color = colors[type] || colors.info;
    console.log(`${color}[Integration Setup]${colors.reset} ${message}`);
  }

  async executeCommand(command, description, cwd = this.backendDir) {
    return new Promise((resolve, reject) => {
      this.log(`Executing: ${description}`, 'info');
      
      const child = exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          this.log(`Error in ${description}: ${error.message}`, 'error');
          reject(error);
          return;
        }
        
        if (stderr && !stderr.includes('Warning')) {
          this.log(` stderr: ${stderr}`, 'warning');
        }
        
        this.log(`✅ ${description} completed`, 'success');
        resolve(stdout);
      });
    });
  }

  async checkNodeVersion() {
    try {
      const { execSync } = require('child_process');
      const nodeVersion = execSync('node --version').toString().trim();
      const npmVersion = execSync('npm --version').toString().trim();
      
      this.log(`Node.js: ${nodeVersion}`, 'info');
      this.log(`npm: ${npmVersion}`, 'info');
      
      return true;
    } catch (error) {
      this.log('Node.js or npm not found', 'error');
      return false;
    }
  }

  async installDependencies() {
    this.log('Installing backend dependencies...', 'info');
    
    try {
      await this.executeCommand('npm install', 'Backend dependencies installation');
      this.log('✅ Backend dependencies installed', 'success');
      return true;
    } catch (error) {
      this.log('Failed to install dependencies', 'error');
      return false;
    }
  }

  async createEnvironmentFile() {
    const envPath = path.join(this.backendDir, '.env');
    
    if (fs.existsSync(envPath)) {
      this.log('Environment file already exists', 'warning');
      return true;
    }

    this.log('Creating environment configuration...', 'info');
    
    const envContent = `# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bugema_elibrary
DB_USER=root
DB_PASSWORD=

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
`;

    try {
      fs.writeFileSync(envPath, envContent);
      this.log('✅ Environment file created', 'success');
      return true;
    } catch (error) {
      this.log('Failed to create environment file', 'error');
      return false;
    }
  }

  async createSampleDataScript() {
    const sampleDataPath = path.join(this.backendDir, 'create_sample_data.sql');
    
    if (fs.existsSync(sampleDataPath)) {
      this.log('Sample data script already exists', 'warning');
      return true;
    }

    this.log('Creating sample data script...', 'info');
    
    const sampleDataContent = `-- Sample Data for Bugema E-Library
-- This script creates test users and sample books

USE bugema_elibrary;

-- Insert test users (passwords are hashed with bcrypt)
INSERT INTO Users (FullName, Email, PasswordHash, Role, Status, DateRegistered) VALUES 
('System Administrator', 'admin@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Active', NOW()),
('Library Staff', 'staff@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Staff', 'Active', NOW()),
('Test Student', 'student@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Active', NOW()),
('John Smith', 'john.smith@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Active', NOW()),
('Jane Doe', 'jane.doe@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Active', NOW());

-- Insert categories
INSERT INTO Categories (Name, Description) VALUES 
('Computer Science', 'Books related to computer science, programming, and technology'),
('Information Science', 'Books on information systems, library science, and data management'),
('Research', 'Academic research methods and methodologies'),
('Web Development', 'Web development, design, and programming'),
('Database', 'Database design, management, and systems'),
('Mathematics', 'Mathematical concepts and applications'),
('Business', 'Business management and administration'),
('Education', 'Educational theory and practice');

-- Insert sample books
INSERT INTO Books (Title, Author, ISBN, CategoryID, Year, Description, Status, DateAdded, DownloadCount) VALUES 
('Introduction to Computer Science', 'Dr. Sarah Johnson', '978-0-123456-78-9', 1, 2020, 'A comprehensive introduction to computer science fundamentals', 'Available', NOW(), 45),
('Digital Libraries and Information Systems', 'Prof. Michael Chen', '978-0-234567-89-0', 2, 2021, 'Modern approaches to digital library management', 'Available', NOW(), 32),
('Academic Research Methods', 'Dr. Emily Williams', '978-0-345678-90-1', 3, 2019, 'Essential guide to academic research methodologies', 'Available', NOW(), 28),
('Web Development Fundamentals', 'James Anderson', '978-0-456789-01-2', 4, 2022, 'Complete guide to modern web development', 'Available', NOW(), 67),
('Database Management Systems', 'Dr. Robert Taylor', '978-0-567890-12-3', 5, 2020, 'Comprehensive database management and design', 'Available', NOW(), 51),
('Advanced Mathematics', 'Dr. Lisa Brown', '978-0-678901-23-4', 6, 2021, 'Advanced mathematical concepts and applications', 'Available', NOW(), 23),
('Business Administration', 'Prof. David Wilson', '978-0-789012-34-5', 7, 2020, 'Modern business administration principles', 'Available', NOW(), 38),
('Educational Technology', 'Dr. Maria Garcia', '978-0-890123-45-6', 8, 2022, 'Technology in education and learning', 'Available', NOW(), 42);

-- Insert sample downloads
INSERT INTO Downloads (UserID, BookID, DownloadDate, IPAddress, DownloadStatus) VALUES 
(3, 1, NOW(), '127.0.0.1', 'Completed'),
(3, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), '127.0.0.1', 'Completed'),
(4, 3, DATE_SUB(NOW(), INTERVAL 2 DAY), '127.0.0.1', 'Completed'),
(5, 4, DATE_SUB(NOW(), INTERVAL 3 DAY), '127.0.0.1', 'Completed'),
(3, 5, DATE_SUB(NOW(), INTERVAL 4 DAY), '127.0.0.1', 'Completed');

SELECT 'Sample data created successfully!' as Status;
`;

    try {
      fs.writeFileSync(sampleDataPath, sampleDataContent);
      this.log('✅ Sample data script created', 'success');
      return true;
    } catch (error) {
      this.log('Failed to create sample data script', 'error');
      return false;
    }
  }

  async createStartupScript() {
    const startupPath = path.join(this.projectRoot, 'start_elibrary.bat');
    
    if (fs.existsSync(startupPath)) {
      this.log('Startup script already exists', 'warning');
      return true;
    }

    this.log('Creating startup script...', 'info');
    
    const startupContent = `@echo off
echo ========================================
echo    Bugema E-Library System Startup
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/4] Installing dependencies...
cd backend
npm install >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo [3/4] Starting the server...
echo.
echo Server will start on: http://localhost:5000
echo Login page: http://localhost:5000/login.html
echo.
echo Test credentials:
echo   Admin: admin@bugema.ac.ug / admin123
echo   Staff: staff@bugema.ac.ug / staff123
echo   Student: student@bugema.ac.ug / student123
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause
`;

    try {
      fs.writeFileSync(startupPath, startupContent);
      this.log('✅ Startup script created', 'success');
      return true;
    } catch (error) {
      this.log('Failed to create startup script', 'error');
      return false;
    }
  }

  async createIntegrationGuide() {
    const guidePath = path.join(this.projectRoot, 'INTEGRATION_GUIDE.md');
    
    if (fs.existsSync(guidePath)) {
      this.log('Integration guide already exists', 'warning');
      return true;
    }

    this.log('Creating integration guide...', 'info');
    
    const guideContent = `# 🚀 Bugema E-Library Complete Integration Guide

## 📋 System Overview
This guide connects all components of the Bugema E-Library system:
- ✅ MySQL Database (Optimized schema)
- ✅ Backend API (Node.js + Express)
- ✅ Frontend (HTML + Tailwind CSS)
- ✅ Role-based Authentication
- ✅ Dashboard System

## 🎯 Quick Start

### 1. Database Setup
\`\`\`bash
# Deploy database schema
mysql -u root -p < backend/database_schema_optimized.sql

# Create sample data
mysql -u root -p bugema_elibrary < backend/create_sample_data.sql
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd backend
npm install
npm start
\`\`\`

### 3. Access the System
- **Login Page**: http://localhost:5000/login.html
- **Admin Dashboard**: http://localhost:5000/admin/dashboard.html
- **Staff Dashboard**: http://localhost:5000/staff/dashboard.html
- **User Dashboard**: http://localhost:5000/user/dashboard.html

## 🔐 Test Credentials
| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Admin | admin@bugema.ac.ug | admin123 | /admin/dashboard |
| Staff | staff@bugema.ac.ug | staff123 | /staff/dashboard |
| Student | student@bugema.ac.ug | student123 | /user/dashboard |

## 🗄️ Database Structure
- **Users**: Authentication and role management
- **Books**: E-book management and metadata
- **Categories**: Book categorization system
- **Downloads**: Download tracking and analytics

## 🔌 API Endpoints
- **Authentication**: \`/api/auth/role-login\`
- **Books**: \`/api/books\`
- **Users**: \`/api/users\`
- **Downloads**: \`/api/downloads\`
- **Categories**: \`/api/categories\`

## 🛡️ Security Features
- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention

## 🧪 Testing
Open \`test_role_based_auth.html\` in your browser to test:
- Role-based login
- API endpoints
- Error handling
- Session management

## 📊 Dashboard Features
- **Admin**: User management, system statistics, full control
- **Staff**: Book management, download tracking, limited access
- **Student**: Book browsing, download history, profile management

## 🔧 Configuration
Edit \`backend/.env\` to configure:
- Database connection
- JWT secret
- File upload paths
- API settings

## 🚨 Troubleshooting
1. **Database Connection**: Check MySQL service and credentials
2. **Port Conflicts**: Change PORT in .env file
3. **Missing Dependencies**: Run \`npm install\`
4. **Authentication Issues**: Verify JWT secret and user status

## 📞 Support
For issues:
1. Check server logs
2. Verify database connection
3. Test API endpoints individually
4. Review configuration settings

---

**🎉 The complete integrated E-Library system is ready for use!**
`;

    try {
      fs.writeFileSync(guidePath, guideContent);
      this.log('✅ Integration guide created', 'success');
      return true;
    } catch (error) {
      this.log('Failed to create integration guide', 'error');
      return false;
    }
  }

  async verifyFileStructure() {
    this.log('Verifying file structure...', 'info');
    
    const requiredFiles = [
      'backend/database_schema_optimized.sql',
      'backend/server_mysql.js',
      'backend/config/mysql_database.js',
      'backend/controllers/mysql/roleBasedAuthController.js',
      'backend/middleware/roleBasedAuth.js',
      'backend/routes/mysql/roleBasedAuthRoutes.js',
      'login.html',
      'admin/dashboard.html',
      'staff/dashboard.html',
      'user/dashboard.html'
    ];

    let allFilesExist = true;
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        this.log(`✅ ${file}`, 'success');
      } else {
        this.log(`❌ Missing: ${file}`, 'error');
        allFilesExist = false;
      }
    }

    return allFilesExist;
  }

  async runCompleteIntegration() {
    console.log('🚀 Starting Complete E-Library Integration Setup\n');

    try {
      // Step 1: Check Node.js
      if (!await this.checkNodeVersion()) {
        this.log('Please install Node.js first', 'error');
        return false;
      }

      // Step 2: Verify file structure
      if (!await this.verifyFileStructure()) {
        this.log('Some required files are missing', 'error');
        return false;
      }

      // Step 3: Install dependencies
      if (!await this.installDependencies()) {
        this.log('Failed to install dependencies', 'error');
        return false;
      }

      // Step 4: Create environment file
      if (!await this.createEnvironmentFile()) {
        this.log('Failed to create environment file', 'error');
        return false;
      }

      // Step 5: Create sample data
      if (!await this.createSampleDataScript()) {
        this.log('Failed to create sample data script', 'error');
        return false;
      }

      // Step 6: Create startup script
      if (!await this.createStartupScript()) {
        this.log('Failed to create startup script', 'error');
        return false;
      }

      // Step 7: Create integration guide
      if (!await this.createIntegrationGuide()) {
        this.log('Failed to create integration guide', 'error');
        return false;
      }

      // Success!
      console.log('\n🎉 Integration Setup Completed Successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Deploy the database schema:');
      console.log('   mysql -u root -p < backend/database_schema_optimized.sql');
      console.log('2. Create sample data:');
      console.log('   mysql -u root -p bugema_elibrary < backend/create_sample_data.sql');
      console.log('3. Start the server:');
      console.log('   cd backend && npm start');
      console.log('4. Or use the startup script:');
      console.log('   start_elibrary.bat');
      console.log('\n🌐 Access Points:');
      console.log('• Login: http://localhost:5000/login.html');
      console.log('• Admin: http://localhost:5000/admin/dashboard.html');
      console.log('• Staff: http://localhost:5000/staff/dashboard.html');
      console.log('• User: http://localhost:5000/user/dashboard.html');
      console.log('\n🔐 Test Credentials:');
      console.log('• Admin: admin@bugema.ac.ug / admin123');
      console.log('• Staff: staff@bugema.ac.ug / staff123');
      console.log('• Student: student@bugema.ac.ug / student123');

      return true;

    } catch (error) {
      console.error('\n❌ Integration setup failed:', error.message);
      return false;
    }
  }
}

// Run the integration setup
if (require.main === module) {
  const setup = new IntegrationSetup();
  setup.runCompleteIntegration().catch(console.error);
}

module.exports = IntegrationSetup;
