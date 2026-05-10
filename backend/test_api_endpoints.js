const http = require('http');

// Test API endpoints
const testEndpoints = async () => {
  console.log('🔍 Testing API Endpoints...\n');

  const endpoints = [
    { method: 'GET', path: '/api/health', description: 'Health Check' },
    { method: 'POST', path: '/api/auth/test-login', body: JSON.stringify({ email: 'admin@bugema.ac.ug', password: 'admin123' }), description: 'Admin Login' },
    { method: 'POST', path: '/api/auth/test-login', body: JSON.stringify({ email: 'staff@bugema.ac.ug', password: 'staff123' }), description: 'Staff Login' },
    { method: 'POST', path: '/api/auth/test-login', body: JSON.stringify({ email: 'student@bugema.ac.ug', password: 'student123' }), description: 'Student Login' }
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
};

const testEndpoint = async (endpoint) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': endpoint.body ? Buffer.byteLength(endpoint.body) : 0
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
        console.log(`Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ SUCCESS');
          try {
            const response = JSON.parse(data);
            if (response.status === 'success') {
              console.log(`✅ ${response.message}`);
              if (response.user) {
                console.log(`👤 User: ${response.user.email} (${response.user.role})`);
                console.log(`🔄 Redirect: ${response.redirect}`);
              }
            }
          } catch (e) {
            console.log('✅ Response received');
          }
        } else {
          console.log('❌ FAILED');
        }
        
        console.log('---');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
      console.log('❌ ERROR: Unable to connect');
      console.log(`Error: ${error.message}`);
      console.log('---');
      resolve();
    });

    if (endpoint.body) {
      req.write(endpoint.body);
    }
    req.end();
  });
};

// Run tests
testEndpoints().then(() => {
  console.log('🎯 API Endpoint Testing Complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Testing failed:', error.message);
  process.exit(1);
});
