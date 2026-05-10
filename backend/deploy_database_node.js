const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseDeployer {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      console.log('🔌 Connecting to MySQL server...');
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
      });
      console.log('✅ Connected to MySQL server');
      return true;
    } catch (error) {
      console.error('❌ MySQL Connection Error:', error.message);
      console.log('💡 Please ensure MySQL is running and credentials are correct');
      return false;
    }
  }

  async deploySchema() {
    try {
      console.log('📦 Deploying database schema...');
      
      // Read schema file
      const schemaPath = './database_schema_optimized.sql';
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
      }
      
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split schema into individual statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 Found ${statements.length} SQL statements to execute`);
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            await this.connection.execute(statement);
            console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
          } catch (error) {
            // Some statements might fail if they already exist
            console.log(`⚠️  Statement ${i + 1} failed (might be expected): ${error.message}`);
          }
        }
      }
      
      console.log('✅ Database schema deployed successfully');
      return true;
    } catch (error) {
      console.error('❌ Schema deployment error:', error.message);
      return false;
    }
  }

  async deploySampleData() {
    try {
      console.log('👥 Deploying sample data...');
      
      // Read sample data file
      const sampleDataPath = './create_sample_data.sql';
      if (!fs.existsSync(sampleDataPath)) {
        console.log('⚠️  Sample data file not found, skipping...');
        return true;
      }
      
      const sampleData = fs.readFileSync(sampleDataPath, 'utf8');
      
      // Split into statements
      const statements = sampleData
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 Found ${statements.length} sample data statements to execute`);
      
      // Switch to the database first
      await this.connection.execute('USE bugema_elibrary');
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            await this.connection.execute(statement);
            console.log(`✅ Sample data ${i + 1}/${statements.length} executed`);
          } catch (error) {
            console.log(`⚠️  Sample data ${i + 1} failed: ${error.message}`);
          }
        }
      }
      
      console.log('✅ Sample data deployed successfully');
      return true;
    } catch (error) {
      console.error('❌ Sample data deployment error:', error.message);
      return false;
    }
  }

  async verifyDeployment() {
    try {
      console.log('🔍 Verifying deployment...');
      
      // Switch to the database
      await this.connection.execute('USE bugema_elibrary');
      
      // Check if tables exist
      const [tables] = await this.connection.execute('SHOW TABLES');
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`   • ${Object.values(table)[0]}`);
      });
      
      // Check if users exist
      const [users] = await this.connection.execute('SELECT COUNT(*) as count FROM Users');
      console.log(`✅ Found ${users[0].count} users in the database`);
      
      // Check if books exist
      const [books] = await this.connection.execute('SELECT COUNT(*) as count FROM Books');
      console.log(`✅ Found ${books[0].count} books in the database`);
      
      return true;
    } catch (error) {
      console.error('❌ Verification error:', error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 Disconnected from MySQL');
    }
  }

  async deploy() {
    console.log('🚀 Starting Database Deployment Process');
    console.log('='.repeat(50));
    
    try {
      // Step 1: Connect to MySQL
      const connected = await this.connect();
      if (!connected) {
        return false;
      }
      
      // Step 2: Deploy schema
      const schemaDeployed = await this.deploySchema();
      if (!schemaDeployed) {
        return false;
      }
      
      // Step 3: Deploy sample data
      const sampleDataDeployed = await this.deploySampleData();
      if (!sampleDataDeployed) {
        return false;
      }
      
      // Step 4: Verify deployment
      const verified = await this.verifyDeployment();
      if (!verified) {
        return false;
      }
      
      console.log('='.repeat(50));
      console.log('🎉 Database deployment completed successfully!');
      console.log('📊 Database is ready for the E-Library application');
      console.log('='.repeat(50));
      
      return true;
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// Run deployment
if (require.main === module) {
  const deployer = new DatabaseDeployer();
  deployer.deploy().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = DatabaseDeployer;
