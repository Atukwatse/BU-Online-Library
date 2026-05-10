#!/usr/bin/env node

/**
 * API Testing Script
 * Tests all API endpoints with the new database structure
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class APITester {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:5000';
    this.testResults = [];
    this.authToken = null;
    this.createdUser = null;
    this.createdBook = null;
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${this.baseURL}/api${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message,
        data: error.response?.data
      };
    }
  }

  logTest(testName, result, expectedStatus = 200) {
    const passed = result.success && result.status === expectedStatus;
    const logEntry = {
      test: testName,
      status: passed ? 'PASS' : 'FAIL',
      expected: expectedStatus,
      actual: result.status,
      error: result.error || null,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(logEntry);

    const symbol = passed ? '✅' : '❌';
    console.log(`${symbol} ${testName} - ${result.status} ${passed ? '' : '- ' + (result.error || '')}`);

    return passed;
  }

  async testHealthEndpoint() {
    console.log('\n🏥 Testing Health Endpoint');
    const result = await this.makeRequest('GET', '/health');
    return this.logTest('Health Check', result, 200);
  }

  async testUserRegistration() {
    console.log('\n👤 Testing User Registration');
    
    const userData = {
      fullName: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123',
      role: 'Student'
    };

    const result = await this.makeRequest('POST', '/auth/register', userData);
    
    if (result.success) {
      this.createdUser = result.data.user;
      console.log(`   👤 Created user: ${this.createdUser.UserID}`);
    }
    
    return this.logTest('User Registration', result, 201);
  }

  async testUserLogin() {
    console.log('\n🔐 Testing User Login');
    
    if (!this.createdUser) {
      console.log('   ⚠️  Skipping login - no user created');
      return false;
    }

    const loginData = {
      email: this.createdUser.Email,
      password: 'testpassword123'
    };

    const result = await this.makeRequest('POST', '/auth/login', loginData);
    
    if (result.success) {
      this.authToken = result.data.token;
      console.log(`   🔐 Login successful - Token received`);
    }
    
    return this.logTest('User Login', result, 200);
  }

  async testGetCurrentUser() {
    console.log('\n👤 Testing Get Current User');
    
    if (!this.authToken) {
      console.log('   ⚠️  Skipping get user - no auth token');
      return false;
    }

    const result = await this.makeRequest('GET', '/auth/me', null, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    return this.logTest('Get Current User', result, 200);
  }

  async testCreateCategory() {
    console.log('\n📚 Testing Create Category');
    
    if (!this.authToken) {
      console.log('   ⚠️  Skipping category creation - no auth token');
      return false;
    }

    const categoryData = {
      name: 'Test Category',
      description: 'A test category for API testing'
    };

    const result = await this.makeRequest('POST', '/categories', categoryData, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    if (result.success) {
      this.createdCategory = result.data;
      console.log(`   📚 Created category: ${this.createdCategory.CategoryID}`);
    }
    
    return this.logTest('Create Category', result, 201);
  }

  async testCreateBook() {
    console.log('\n📖 Testing Create Book');
    
    if (!this.authToken || !this.createdCategory) {
      console.log('   ⚠️  Skipping book creation - missing auth token or category');
      return false;
    }

    const bookData = {
      title: 'Test Book for API Testing',
      author: 'Test Author',
      isbn: `978-${Date.now()}`,
      categoryID: this.createdCategory.CategoryID,
      year: 2024,
      description: 'A test book created for API testing',
      status: 'Available'
    };

    const result = await this.makeRequest('POST', '/books', bookData, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    if (result.success) {
      this.createdBook = result.data.data;
      console.log(`   📖 Created book: ${this.createdBook.BookID}`);
    }
    
    return this.logTest('Create Book', result, 201);
  }

  async testGetAllBooks() {
    console.log('\n📚 Testing Get All Books');
    
    const result = await this.makeRequest('GET', '/books');
    return this.logTest('Get All Books', result, 200);
  }

  async testGetBookById() {
    console.log('\n📖 Testing Get Book by ID');
    
    if (!this.createdBook) {
      console.log('   ⚠️  Skipping get book - no book created');
      return false;
    }

    const result = await this.makeRequest('GET', `/books/${this.createdBook.BookID}`);
    return this.logTest('Get Book by ID', result, 200);
  }

  async testDownloadBook() {
    console.log('\n⬇️  Testing Download Book');
    
    if (!this.authToken || !this.createdBook) {
      console.log('   ⚠️  Skipping download - missing auth token or book');
      return false;
    }

    const result = await this.makeRequest('POST', `/books/${this.createdBook.BookID}/download`, null, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    return this.logTest('Download Book', result, 200);
  }

  async testGetPopularBooks() {
    console.log('\n🔥 Testing Get Popular Books');
    
    const result = await this.makeRequest('GET', '/books/popular');
    return this.logTest('Get Popular Books', result, 200);
  }

  async testErrorHandling() {
    console.log('\n🚫 Testing Error Handling');
    
    // Test non-existent book
    const result1 = await this.makeRequest('GET', '/books/99999');
    const test1 = this.logTest('Non-existent Book (404)', result1, 404);
    
    // Test invalid login
    const result2 = await this.makeRequest('POST', '/auth/login', {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });
    const test2 = this.logTest('Invalid Login (401)', result2, 401);
    
    // Test invalid registration data
    const result3 = await this.makeRequest('POST', '/auth/register', {
      fullName: '',
      email: 'invalid-email',
      password: '123'
    });
    const test3 = this.logTest('Invalid Registration (400)', result3, 400);
    
    return test1 && test2 && test3;
  }

  async testDatabasePerformance() {
    console.log('\n⚡ Testing Database Performance');
    
    const tests = [
      { name: 'Get All Books', endpoint: '/books' },
      { name: 'Get Popular Books', endpoint: '/books/popular' },
      { name: 'Health Check', endpoint: '/health' }
    ];

    const results = [];
    
    for (const test of tests) {
      const times = [];
      
      // Run each test 5 times
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await this.makeRequest('GET', test.endpoint);
        const duration = Date.now() - start;
        times.push(duration);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`   ⏱️  ${test.name}: Avg ${avgTime.toFixed(2)}ms (Min: ${minTime}ms, Max: ${maxTime}ms)`);
      
      results.push({
        test: test.name,
        average: avgTime,
        min: minTime,
        max: maxTime
      });
    }
    
    return results;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    if (this.createdBook && this.authToken) {
      await this.makeRequest('DELETE', `/books/${this.createdBook.BookID}`, null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      console.log('   🗑️  Deleted test book');
    }
    
    if (this.createdCategory && this.authToken) {
      await this.makeRequest('DELETE', `/categories/${this.createdCategory.CategoryID}`, null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      console.log('   🗑️  Deleted test category');
    }
    
    if (this.createdUser && this.authToken) {
      await this.makeRequest('DELETE', `/users/${this.createdUser.UserID}`, null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      console.log('   🗑️  Deleted test user');
    }
  }

  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('📊 API TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('='.repeat(60));

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`   • ${r.test} - Expected ${r.expected}, got ${r.actual}`);
          if (r.error) console.log(`     Error: ${r.error}`);
        });
    }

    // Save report to file
    const reportData = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: parseFloat(successRate)
      },
      tests: this.testResults,
      timestamp: new Date().toISOString()
    };

    const reportPath = path.join(__dirname, '..', 'test_results.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return successRate >= 90; // Consider successful if 90%+ tests pass
  }

  async runAllTests() {
    console.log('🚀 Starting API Testing\n');
    console.log(`🌐 Testing against: ${this.baseURL}\n`);

    try {
      // Core functionality tests
      const tests = [
        () => this.testHealthEndpoint(),
        () => this.testUserRegistration(),
        () => this.testUserLogin(),
        () => this.testGetCurrentUser(),
        () => this.testCreateCategory(),
        () => this.testCreateBook(),
        () => this.testGetAllBooks(),
        () => this.testGetBookById(),
        () => this.testDownloadBook(),
        () => this.testGetPopularBooks(),
        () => this.testErrorHandling()
      ];

      let allPassed = true;
      for (const test of tests) {
        const passed = await test();
        allPassed = allPassed && passed;
      }

      // Performance tests
      await this.testDatabasePerformance();

      // Cleanup
      await this.cleanup();

      // Generate report
      const success = this.generateReport();

      if (success) {
        console.log('\n🎉 All API tests completed successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some API tests failed. Please review the report.');
        process.exit(1);
      }

    } catch (error) {
      console.error('\n❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }
}

// Run tests
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests().catch(console.error);
}

module.exports = APITester;
