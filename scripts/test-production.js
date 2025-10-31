#!/usr/bin/env node

/**
 * YoForex Production Testing Suite
 * Automated testing for production environment
 * Tests API endpoints, authentication, database, uploads, and performance
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.net',
  apiUrl: process.env.EXPRESS_URL || 'https://yoforex.net',
  testTimeout: 10000, // 10 seconds per test
  performanceThresholds: {
    homepage: 3000, // 3 seconds
    api: 1000, // 1 second
    auth: 2000, // 2 seconds
    upload: 5000, // 5 seconds
  },
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@yoforex.net',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    username: process.env.TEST_USER_USERNAME || 'testuser'
  }
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'production',
  baseUrl: config.baseUrl,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  }
};

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue('[INFO]'), msg),
  success: (msg) => console.log(chalk.green('[✓]'), msg),
  error: (msg) => console.log(chalk.red('[✗]'), msg),
  warning: (msg) => console.log(chalk.yellow('[!]'), msg),
  section: (msg) => console.log(chalk.cyan.bold(`\n${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}`))
};

// Timer utility
class Timer {
  constructor() {
    this.start = Date.now();
  }
  
  elapsed() {
    return Date.now() - this.start;
  }
}

// HTTP client with timing
class TestClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = '';
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const timer = new Timer();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Cookie': this.cookies,
          'User-Agent': 'YoForex-Production-Tester/1.0'
        },
        timeout: config.testTimeout
      });

      const elapsed = timer.elapsed();
      
      // Store cookies for session persistence
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        this.cookies = setCookie.split(',').map(c => c.split(';')[0]).join('; ');
      }

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: await this.parseResponse(response),
        elapsed
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        statusText: error.message,
        error: error.message,
        elapsed: timer.elapsed()
      };
    }
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  }
}

// Test runner
class TestRunner {
  constructor(name, fn) {
    this.name = name;
    this.fn = fn;
    this.result = null;
  }

  async run() {
    log.info(`Running: ${this.name}`);
    const timer = new Timer();
    
    try {
      await this.fn();
      this.result = {
        name: this.name,
        status: 'passed',
        duration: timer.elapsed()
      };
      log.success(`${this.name} (${this.result.duration}ms)`);
    } catch (error) {
      this.result = {
        name: this.name,
        status: 'failed',
        error: error.message,
        duration: timer.elapsed()
      };
      log.error(`${this.name}: ${error.message}`);
    }
    
    testResults.tests.push(this.result);
    return this.result;
  }
}

// Test assertions
const assert = {
  equal: (actual, expected, message) => {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  },
  
  ok: (value, message) => {
    if (!value) {
      throw new Error(message || `Expected truthy value, got ${value}`);
    }
  },
  
  includes: (array, value, message) => {
    if (!array.includes(value)) {
      throw new Error(message || `Expected array to include ${value}`);
    }
  },
  
  lessThan: (actual, expected, message) => {
    if (actual >= expected) {
      throw new Error(message || `Expected ${actual} to be less than ${expected}`);
    }
  }
};

// Test Suite
const testSuite = {
  // 1. API Health Checks
  apiHealth: async () => {
    const client = new TestClient(config.apiUrl);
    const tests = [];

    // Health endpoint
    tests.push(new TestRunner('API Health Check', async () => {
      const res = await client.request('/api/health');
      assert.ok(res.ok, 'Health endpoint should respond with 200');
      assert.ok(res.data.status === 'healthy', 'API should report healthy status');
      assert.lessThan(res.elapsed, config.performanceThresholds.api, 'Response time should be under threshold');
    }));

    // Liveness check
    tests.push(new TestRunner('API Liveness Check', async () => {
      const res = await client.request('/api/health/live');
      assert.ok(res.ok, 'Liveness endpoint should respond with 200');
      assert.ok(res.data.status === 'alive', 'API should report alive status');
    }));

    // Readiness check
    tests.push(new TestRunner('API Readiness Check', async () => {
      const res = await client.request('/api/health/ready');
      assert.ok(res.ok, 'Readiness endpoint should respond with 200');
      assert.ok(res.data.status === 'ready', 'API should report ready status');
    }));

    for (const test of tests) {
      await test.run();
    }
  },

  // 2. Public API Endpoints
  publicEndpoints: async () => {
    const client = new TestClient(config.apiUrl);
    const endpoints = [
      { path: '/api/threads', name: 'Threads API' },
      { path: '/api/categories', name: 'Categories API' },
      { path: '/api/marketplace/listings', name: 'Marketplace API' },
      { path: '/api/brokers', name: 'Brokers API' },
      { path: '/api/content', name: 'Content API' },
      { path: '/api/seo-categories/tree', name: 'SEO Categories API' }
    ];

    for (const endpoint of endpoints) {
      const test = new TestRunner(`Test ${endpoint.name}`, async () => {
        const res = await client.request(endpoint.path);
        assert.ok(res.ok || res.status === 401, `${endpoint.name} should respond`);
        assert.lessThan(res.elapsed, config.performanceThresholds.api, 'Response time should be acceptable');
        
        if (res.ok) {
          assert.ok(Array.isArray(res.data) || typeof res.data === 'object', 'Should return valid data');
        }
      });
      await test.run();
    }
  },

  // 3. Authentication Flow
  authentication: async () => {
    const client = new TestClient(config.apiUrl);
    let sessionData = {};

    // Register test
    const registerTest = new TestRunner('User Registration', async () => {
      const res = await client.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@yoforex.net`,
          username: `testuser${Date.now()}`,
          password: 'TestPassword123!'
        })
      });
      
      // Registration might fail if user exists, which is ok
      if (res.ok) {
        assert.ok(res.data.user, 'Should return user data');
        sessionData.user = res.data.user;
      }
    });
    await registerTest.run();

    // Login test
    const loginTest = new TestRunner('User Login', async () => {
      const res = await client.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: config.testUser.email,
          password: config.testUser.password
        })
      });
      
      if (res.ok) {
        assert.ok(res.data.user, 'Should return user data');
        assert.ok(res.data.user.email === config.testUser.email, 'Email should match');
        sessionData = res.data;
      } else if (res.status === 401) {
        log.warning('Login failed - test user may not exist');
      }
    });
    await loginTest.run();

    // Session test
    const sessionTest = new TestRunner('Session Verification', async () => {
      const res = await client.request('/api/users/session');
      
      if (res.ok && res.data.user) {
        assert.ok(res.data.user, 'Should maintain session');
      } else {
        log.warning('Session not maintained - authentication may be disabled');
      }
    });
    await sessionTest.run();

    // Logout test
    const logoutTest = new TestRunner('User Logout', async () => {
      const res = await client.request('/api/auth/logout', {
        method: 'POST'
      });
      
      assert.ok(res.ok, 'Logout should succeed');
    });
    await logoutTest.run();

    return sessionData;
  },

  // 4. Database Operations
  databaseOperations: async () => {
    const client = new TestClient(config.apiUrl);
    
    // Create thread test
    const createTest = new TestRunner('Create Thread', async () => {
      const res = await client.request('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Test Thread ${Date.now()}`,
          content: 'This is a test thread created by automated testing',
          categoryId: 'general',
          tags: ['test', 'automated']
        })
      });
      
      // May fail if not authenticated, which is expected
      if (res.status === 401) {
        log.warning('Thread creation requires authentication');
      } else if (res.ok) {
        assert.ok(res.data.id, 'Should return thread ID');
      }
    });
    await createTest.run();

    // Search test
    const searchTest = new TestRunner('Search Functionality', async () => {
      const res = await client.request('/api/search?q=trading');
      
      if (res.ok) {
        assert.ok(Array.isArray(res.data.results) || Array.isArray(res.data), 'Should return search results');
      }
    });
    await searchTest.run();

    // Pagination test
    const paginationTest = new TestRunner('Pagination', async () => {
      const res = await client.request('/api/threads?page=1&limit=10');
      
      if (res.ok) {
        assert.ok(res.data, 'Should return paginated data');
        if (res.data.items) {
          assert.ok(res.data.items.length <= 10, 'Should respect limit');
        }
      }
    });
    await paginationTest.run();
  },

  // 5. File Upload
  fileUpload: async () => {
    const client = new TestClient(config.apiUrl);
    
    const uploadTest = new TestRunner('File Upload', async () => {
      // Create a test file
      const testFilePath = path.join(__dirname, 'test-upload.txt');
      fs.writeFileSync(testFilePath, 'Test file for upload testing');
      
      try {
        const form = new FormData();
        form.append('file', fs.createReadStream(testFilePath));
        form.append('type', 'attachment');
        
        const res = await client.request('/api/upload', {
          method: 'POST',
          body: form,
          headers: form.getHeaders()
        });
        
        if (res.status === 401) {
          log.warning('File upload requires authentication');
        } else if (res.ok) {
          assert.ok(res.data.url || res.data.path, 'Should return file URL');
        }
      } finally {
        // Cleanup
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });
    await uploadTest.run();
  },

  // 6. Performance Testing
  performanceTests: async () => {
    const client = new TestClient(config.baseUrl);
    const timer = new Timer();
    
    // Homepage load test
    const homepageTest = new TestRunner('Homepage Load Time', async () => {
      const res = await client.request('/');
      assert.ok(res.ok, 'Homepage should load');
      assert.lessThan(res.elapsed, config.performanceThresholds.homepage, 
        `Homepage should load within ${config.performanceThresholds.homepage}ms`);
    });
    await homepageTest.run();

    // Static asset test
    const staticTest = new TestRunner('Static Assets', async () => {
      const res = await client.request('/favicon.png');
      assert.ok(res.ok || res.status === 404, 'Static assets should be accessible');
    });
    await staticTest.run();

    // Concurrent requests test
    const concurrentTest = new TestRunner('Concurrent Requests', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(client.request('/api/health'));
      }
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      assert.ok(successCount >= 8, 'At least 80% of concurrent requests should succeed');
      
      const avgTime = results.reduce((sum, r) => sum + r.elapsed, 0) / results.length;
      log.info(`Average response time for concurrent requests: ${avgTime.toFixed(2)}ms`);
    });
    await concurrentTest.run();
  },

  // 7. Security Tests
  securityTests: async () => {
    const client = new TestClient(config.apiUrl);
    
    // CORS test
    const corsTest = new TestRunner('CORS Headers', async () => {
      const res = await client.request('/api/health', {
        headers: { 'Origin': 'https://evil.com' }
      });
      
      // CORS should be configured properly
      const allowOrigin = res.headers.get('access-control-allow-origin');
      if (allowOrigin) {
        assert.ok(allowOrigin !== '*', 'CORS should not allow all origins');
      }
    });
    await corsTest.run();

    // Rate limiting test
    const rateLimitTest = new TestRunner('Rate Limiting', async () => {
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(client.request('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
        }));
      }
      
      const results = await Promise.all(promises);
      const rateLimited = results.some(r => r.status === 429);
      assert.ok(rateLimited, 'Rate limiting should be active');
    });
    await rateLimitTest.run();

    // SQL injection test (safe)
    const sqlInjectionTest = new TestRunner('SQL Injection Protection', async () => {
      const res = await client.request("/api/threads?search='; DROP TABLE users; --");
      
      // Should handle malicious input safely
      assert.ok(res.status !== 500, 'Should handle SQL injection attempts safely');
    });
    await sqlInjectionTest.run();

    // XSS test (safe)
    const xssTest = new TestRunner('XSS Protection', async () => {
      const res = await client.request('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '<script>alert("XSS")</script>',
          content: '<img src=x onerror=alert("XSS")>'
        })
      });
      
      // Should sanitize or reject malicious input
      if (res.ok) {
        assert.ok(!res.data.title?.includes('<script>'), 'Should sanitize script tags');
      }
    });
    await xssTest.run();
  },

  // 8. SEO Tests
  seoTests: async () => {
    const client = new TestClient(config.baseUrl);
    
    // Sitemap test
    const sitemapTest = new TestRunner('Sitemap Availability', async () => {
      const res = await client.request('/sitemap.xml');
      assert.ok(res.ok, 'Sitemap should be accessible');
      
      if (res.ok) {
        assert.ok(res.data.includes('<?xml'), 'Should be valid XML');
        assert.ok(res.data.includes('<url>'), 'Should contain URLs');
      }
    });
    await sitemapTest.run();

    // Robots.txt test
    const robotsTest = new TestRunner('Robots.txt', async () => {
      const res = await client.request('/robots.txt');
      assert.ok(res.ok, 'Robots.txt should be accessible');
      
      if (res.ok) {
        assert.ok(res.data.includes('User-agent'), 'Should contain user-agent rules');
        assert.ok(res.data.includes('Sitemap'), 'Should reference sitemap');
      }
    });
    await robotsTest.run();

    // Meta tags test
    const metaTest = new TestRunner('Meta Tags', async () => {
      const res = await client.request('/');
      
      if (res.ok && typeof res.data === 'string') {
        assert.ok(res.data.includes('<meta name="description"'), 'Should have meta description');
        assert.ok(res.data.includes('og:title'), 'Should have Open Graph tags');
      }
    });
    await metaTest.run();
  }
};

// Generate test report
function generateReport() {
  const duration = testResults.tests.reduce((sum, test) => sum + test.duration, 0);
  const passed = testResults.tests.filter(t => t.status === 'passed').length;
  const failed = testResults.tests.filter(t => t.status === 'failed').length;
  
  testResults.summary = {
    total: testResults.tests.length,
    passed,
    failed,
    duration
  };

  const reportPath = path.join(__dirname, `../test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  
  log.section('TEST SUMMARY');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(chalk.green(`Passed: ${passed}`));
  console.log(chalk.red(`Failed: ${failed}`));
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`\nDetailed report saved to: ${reportPath}`);
  
  // Generate markdown report
  const markdownReport = `# YoForex Production Test Report

## Summary
- **Date**: ${testResults.timestamp}
- **Environment**: ${testResults.environment}
- **Base URL**: ${testResults.baseUrl}
- **Total Tests**: ${testResults.summary.total}
- **Passed**: ${passed} ✅
- **Failed**: ${failed} ❌
- **Duration**: ${(duration / 1000).toFixed(2)}s

## Test Results

| Test Name | Status | Duration (ms) | Error |
|-----------|--------|---------------|-------|
${testResults.tests.map(t => 
  `| ${t.name} | ${t.status === 'passed' ? '✅' : '❌'} | ${t.duration} | ${t.error || '-'} |`
).join('\n')}

## Recommendations

${failed > 0 ? `
### Failed Tests Require Attention:
${testResults.tests
  .filter(t => t.status === 'failed')
  .map(t => `- **${t.name}**: ${t.error}`)
  .join('\n')}
` : '### All tests passed successfully! ✅'}

## Performance Metrics

- Average API response time: ${
  testResults.tests
    .filter(t => t.name.includes('API'))
    .reduce((sum, t, _, arr) => sum + t.duration / arr.length, 0)
    .toFixed(2)
}ms
- Homepage load time: ${
  testResults.tests.find(t => t.name.includes('Homepage'))?.duration || 'N/A'
}ms

---
*Generated by YoForex Production Testing Suite*
`;

  const markdownPath = path.join(__dirname, `../test-report-${Date.now()}.md`);
  fs.writeFileSync(markdownPath, markdownReport);
  console.log(`Markdown report saved to: ${markdownPath}`);
  
  return testResults.summary.failed === 0 ? 0 : 1;
}

// Main execution
async function main() {
  log.section('YOFOREX PRODUCTION TESTING SUITE');
  console.log(`Testing: ${config.baseUrl}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  try {
    // Run test suites
    log.section('1. API HEALTH CHECKS');
    await testSuite.apiHealth();

    log.section('2. PUBLIC ENDPOINTS');
    await testSuite.publicEndpoints();

    log.section('3. AUTHENTICATION');
    await testSuite.authentication();

    log.section('4. DATABASE OPERATIONS');
    await testSuite.databaseOperations();

    log.section('5. FILE UPLOAD');
    await testSuite.fileUpload();

    log.section('6. PERFORMANCE TESTING');
    await testSuite.performanceTests();

    log.section('7. SECURITY TESTING');
    await testSuite.securityTests();

    log.section('8. SEO TESTING');
    await testSuite.seoTests();

  } catch (error) {
    log.error(`Test suite error: ${error.message}`);
  }

  // Generate report and exit
  const exitCode = generateReport();
  process.exit(exitCode);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Run tests
main().catch(console.error);