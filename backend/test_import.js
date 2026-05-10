console.log('🔍 Testing imports...');

try {
  console.log('1. Testing authController import...');
  const authController = require('./controllers/mysql/authController');
  console.log('✅ authController imported successfully');
  console.log('Available methods:', Object.keys(authController));
} catch (error) {
  console.error('❌ authController import failed:', error.message);
}

try {
  console.log('2. Testing authRoutes import...');
  const authRoutes = require('./routes/mysql/authRoutes');
  console.log('✅ authRoutes imported successfully');
} catch (error) {
  console.error('❌ authRoutes import failed:', error.message);
}

try {
  console.log('3. Testing User model import...');
  const User = require('./models/mysql/User');
  console.log('✅ User model imported successfully');
  console.log('Available methods:', Object.getOwnPropertyNames(User).filter(name => typeof User[name] === 'function'));
} catch (error) {
  console.error('❌ User model import failed:', error.message);
}

try {
  console.log('4. Testing database import...');
  const db = require('./config/mock_database');
  console.log('✅ Mock database imported successfully');
} catch (error) {
  console.error('❌ Database import failed:', error.message);
}

console.log('🎯 Import testing complete');
