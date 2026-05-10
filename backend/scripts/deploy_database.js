#!/usr/bin/env node

/**
 * Database Deployment Script
 * Deploys the optimized database schema and runs migrations
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class DatabaseDeployer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.schemaFile = path.join(this.projectRoot, 'database_schema_optimized.sql');
    this.migrationFile = path.join(this.projectRoot, 'database_migration.sql');
    this.backupDir = path.join(this.projectRoot, 'backups');
  }

  async createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log('✅ Created backup directory');
    }
  }

  async backupExistingDatabase() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `bugema_elibrary_backup_${timestamp}.sql`);
      
      console.log('📦 Creating database backup...');
      
      // MySQL backup command (adjust credentials as needed)
      const backupCommand = `mysqldump -u root -p bugema_elibrary > "${backupFile}"`;
      
      try {
        await execPromise(backupCommand);
        console.log(`✅ Database backed up to: ${backupFile}`);
        return backupFile;
      } catch (error) {
        console.warn('⚠️  Backup failed (database might not exist yet):', error.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  async executeSQLFile(sqlFile, description) {
    try {
      console.log(`🔄 ${description}...`);
      
      if (!fs.existsSync(sqlFile)) {
        throw new Error(`SQL file not found: ${sqlFile}`);
      }

      // MySQL command to execute SQL file (adjust credentials as needed)
      const command = `mysql -u root -p bugema_elibrary < "${sqlFile}"`;
      
      await execPromise(command);
      console.log(`✅ ${description} completed successfully`);
    } catch (error) {
      console.error(`❌ ${description} failed:`, error.message);
      throw error;
    }
  }

  async validateDeployment() {
    try {
      console.log('🔍 Validating database deployment...');

      // Check if tables exist
      const validationQuery = `
        SELECT 
          TABLE_NAME,
          TABLE_ROWS,
          DATA_LENGTH,
          INDEX_LENGTH
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = 'bugema_elibrary'
        ORDER BY TABLE_NAME;
      `;

      const command = `mysql -u root -p -e "${validationQuery}" bugema_elibrary`;
      
      const { stdout } = await execPromise(command);
      console.log('📊 Database tables after deployment:');
      console.log(stdout);

      // Check user count
      const userCountQuery = 'SELECT COUNT(*) as user_count FROM Users';
      const { stdout: userResult } = await execPromise(`mysql -u root -p -e "${userCountQuery}" bugema_elibrary`);
      console.log('👥 Users created:', userResult);

      // Check book count
      const bookCountQuery = 'SELECT COUNT(*) as book_count FROM Books';
      const { stdout: bookResult } = await execPromise(`mysql -u root -p -e "${bookCountQuery}" bugema_elibrary`);
      console.log('📚 Books created:', bookResult);

      console.log('✅ Database validation completed successfully');
    } catch (error) {
      console.error('❌ Database validation failed:', error.message);
      throw error;
    }
  }

  async updateEnvironmentFiles() {
    try {
      console.log('⚙️  Updating environment configuration...');

      const envExamplePath = path.join(this.projectRoot, '.env.example');
      const envPath = path.join(this.projectRoot, '.env');

      if (fs.existsSync(envExamplePath)) {
        let envContent = fs.readFileSync(envExamplePath, 'utf8');
        
        // Update database configuration for MySQL
        envContent = envContent.replace(/MONGODB_URI.*/, 'DB_HOST=localhost');
        envContent += '\nDB_PORT=3306';
        envContent += '\nDB_NAME=bugema_elibrary';
        envContent += '\nDB_USER=root';
        envContent += '\nDB_PASSWORD=';

        fs.writeFileSync(envPath, envContent);
        console.log('✅ Environment files updated for MySQL');
      }
    } catch (error) {
      console.error('❌ Failed to update environment files:', error.message);
      throw error;
    }
  }

  async runPerformanceTests() {
    try {
      console.log('⚡ Running performance tests...');

      // Test basic query performance
      const queries = [
        'SELECT COUNT(*) FROM Users',
        'SELECT COUNT(*) FROM Books',
        'SELECT COUNT(*) FROM Downloads',
        'SELECT * FROM Users LIMIT 10',
        'SELECT * FROM Books LIMIT 10',
        'SELECT * FROM Downloads LIMIT 10'
      ];

      for (const query of queries) {
        const start = Date.now();
        await execPromise(`mysql -u root -p -e "${query}" bugema_elibrary`);
        const duration = Date.now() - start;
        console.log(`⏱️  Query: ${query.substring(0, 50)}... - ${duration}ms`);
      }

      console.log('✅ Performance tests completed');
    } catch (error) {
      console.error('❌ Performance tests failed:', error.message);
      // Don't throw error for performance tests
    }
  }

  async deploy() {
    console.log('🚀 Starting Bugema E-Library Database Deployment\n');

    try {
      // Step 1: Create backup directory
      await this.createBackupDirectory();

      // Step 2: Backup existing database
      await this.backupExistingDatabase();

      // Step 3: Deploy optimized schema
      await this.executeSQLFile(this.schemaFile, 'Deploying optimized database schema');

      // Step 4: Run migration script
      await this.executeSQLFile(this.migrationFile, 'Running database migration');

      // Step 5: Validate deployment
      await this.validateDeployment();

      // Step 6: Update environment files
      await this.updateEnvironmentFiles();

      // Step 7: Run performance tests
      await this.runPerformanceTests();

      console.log('\n🎉 Database deployment completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Update backend code to use MySQL models');
      console.log('2. Test all API endpoints');
      console.log('3. Monitor database performance');
      console.log('4. Set up regular backups');

    } catch (error) {
      console.error('\n❌ Database deployment failed:', error.message);
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check MySQL service is running');
      console.log('2. Verify MySQL credentials');
      console.log('3. Check SQL file permissions');
      console.log('4. Review error logs above');
      process.exit(1);
    }
  }
}

// Run deployment
if (require.main === module) {
  const deployer = new DatabaseDeployer();
  deployer.deploy().catch(console.error);
}

module.exports = DatabaseDeployer;
