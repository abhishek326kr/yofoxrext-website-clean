/**
 * Integration Tests for YoForex API Endpoints
 * 
 * These are smoke tests to verify critical endpoints are functioning correctly.
 * Run with: npx tsx tests/api.test.ts
 */

import http from 'http';
import https from 'https';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_USER_ID = '49065260'; // Test user from seed data

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  statusCode?: number;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

/**
 * Simple HTTP request helper
 */
function makeRequest(
  method: string, 
  path: string, 
  body?: any,
  cookie?: string
): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options: http.RequestOptions = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { 'Cookie': cookie } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode || 0, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode || 0, data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Test: GET /api/categories
 */
async function testGetCategories() {
  const startTime = Date.now();
  try {
    const { statusCode, data } = await makeRequest('GET', '/api/categories');
    
    if (statusCode === 200 && Array.isArray(data)) {
      results.push({
        endpoint: 'GET /api/categories',
        method: 'GET',
        status: 'PASS',
        statusCode,
        duration: Date.now() - startTime,
      });
      console.log('✓ GET /api/categories - PASS');
    } else {
      throw new Error(`Expected 200 and array, got ${statusCode}`);
    }
  } catch (error: any) {
    results.push({
      endpoint: 'GET /api/categories',
      method: 'GET',
      status: 'FAIL',
      error: error.message,
      duration: Date.now() - startTime,
    });
    console.log('✗ GET /api/categories - FAIL:', error.message);
  }
}

/**
 * Test: GET /api/threads
 */
async function testGetThreads() {
  const startTime = Date.now();
  try {
    const { statusCode, data } = await makeRequest('GET', '/api/threads');
    
    if (statusCode === 200 && Array.isArray(data)) {
      results.push({
        endpoint: 'GET /api/threads',
        method: 'GET',
        status: 'PASS',
        statusCode,
        duration: Date.now() - startTime,
      });
      console.log('✓ GET /api/threads - PASS');
    } else {
      throw new Error(`Expected 200 and array, got ${statusCode}`);
    }
  } catch (error: any) {
    results.push({
      endpoint: 'GET /api/threads',
      method: 'GET',
      status: 'FAIL',
      error: error.message,
      duration: Date.now() - startTime,
    });
    console.log('✗ GET /api/threads - FAIL:', error.message);
  }
}

/**
 * Test: GET /api/stats
 */
async function testGetStats() {
  const startTime = Date.now();
  try {
    const { statusCode, data } = await makeRequest('GET', '/api/stats');
    
    if (statusCode === 200 && data.totalThreads !== undefined) {
      results.push({
        endpoint: 'GET /api/stats',
        method: 'GET',
        status: 'PASS',
        statusCode,
        duration: Date.now() - startTime,
      });
      console.log('✓ GET /api/stats - PASS');
    } else {
      throw new Error(`Expected 200 and stats object, got ${statusCode}`);
    }
  } catch (error: any) {
    results.push({
      endpoint: 'GET /api/stats',
      method: 'GET',
      status: 'FAIL',
      error: error.message,
      duration: Date.now() - startTime,
    });
    console.log('✗ GET /api/stats - FAIL:', error.message);
  }
}

/**
 * Test: POST /api/feedback (unauthenticated - should work)
 */
async function testPostFeedback() {
  const startTime = Date.now();
  try {
    const { statusCode, data } = await makeRequest('POST', '/api/feedback', {
      type: 'feature',
      subject: 'Test feedback',
      message: 'This is a test feedback submission from integration tests',
      email: 'test@example.com',
    });
    
    if (statusCode === 200 || statusCode === 201) {
      results.push({
        endpoint: 'POST /api/feedback',
        method: 'POST',
        status: 'PASS',
        statusCode,
        duration: Date.now() - startTime,
      });
      console.log('✓ POST /api/feedback - PASS');
    } else {
      throw new Error(`Expected 200/201, got ${statusCode}`);
    }
  } catch (error: any) {
    results.push({
      endpoint: 'POST /api/feedback',
      method: 'POST',
      status: 'FAIL',
      error: error.message,
      duration: Date.now() - startTime,
    });
    console.log('✗ POST /api/feedback - FAIL:', error.message);
  }
}

/**
 * Test: GET /api/notifications/unread-count (unauthenticated - should fail or return 401)
 */
async function testGetNotificationsUnreadCount() {
  const startTime = Date.now();
  try {
    const { statusCode, data } = await makeRequest('GET', '/api/notifications/unread-count');
    
    // This endpoint requires authentication, so we expect 401
    if (statusCode === 401 || statusCode === 200) {
      results.push({
        endpoint: 'GET /api/notifications/unread-count',
        method: 'GET',
        status: 'PASS',
        statusCode,
        duration: Date.now() - startTime,
      });
      console.log('✓ GET /api/notifications/unread-count - PASS (endpoint exists)');
    } else {
      throw new Error(`Expected 401 or 200, got ${statusCode}`);
    }
  } catch (error: any) {
    results.push({
      endpoint: 'GET /api/notifications/unread-count',
      method: 'GET',
      status: 'FAIL',
      error: error.message,
      duration: Date.now() - startTime,
    });
    console.log('✗ GET /api/notifications/unread-count - FAIL:', error.message);
  }
}

/**
 * Test: GET /api/brokers
 */
async function testGetBrokers() {
  const startTime = Date.now();
  try {
    const { statusCode, data } = await makeRequest('GET', '/api/brokers');
    
    if (statusCode === 200 && Array.isArray(data)) {
      results.push({
        endpoint: 'GET /api/brokers',
        method: 'GET',
        status: 'PASS',
        statusCode,
        duration: Date.now() - startTime,
      });
      console.log('✓ GET /api/brokers - PASS');
    } else {
      throw new Error(`Expected 200 and array, got ${statusCode}`);
    }
  } catch (error: any) {
    results.push({
      endpoint: 'GET /api/brokers',
      method: 'GET',
      status: 'FAIL',
      error: error.message,
      duration: Date.now() - startTime,
    });
    console.log('✗ GET /api/brokers - FAIL:', error.message);
  }
}

/**
 * Test: GET /api/hot
 */
async function testGetHot() {
  const startTime = Date.now();
  try {
    const { statusCode, data } = await makeRequest('GET', '/api/hot');
    
    if (statusCode === 200 && data.items !== undefined) {
      results.push({
        endpoint: 'GET /api/hot',
        method: 'GET',
        status: 'PASS',
        statusCode,
        duration: Date.now() - startTime,
      });
      console.log('✓ GET /api/hot - PASS');
    } else {
      throw new Error(`Expected 200 and hot items, got ${statusCode}`);
    }
  } catch (error: any) {
    results.push({
      endpoint: 'GET /api/hot',
      method: 'GET',
      status: 'FAIL',
      error: error.message,
      duration: Date.now() - startTime,
    });
    console.log('✗ GET /api/hot - FAIL:', error.message);
  }
}

/**
 * Test: GET /api/content/top-sellers
 */
async function testGetTopSellers() {
  const startTime = Date.now();
  try {
    const { statusCode, data } = await makeRequest('GET', '/api/content/top-sellers');
    
    if (statusCode === 200) {
      results.push({
        endpoint: 'GET /api/content/top-sellers',
        method: 'GET',
        status: 'PASS',
        statusCode,
        duration: Date.now() - startTime,
      });
      console.log('✓ GET /api/content/top-sellers - PASS');
    } else {
      throw new Error(`Expected 200, got ${statusCode}`);
    }
  } catch (error: any) {
    results.push({
      endpoint: 'GET /api/content/top-sellers',
      method: 'GET',
      status: 'FAIL',
      error: error.message,
      duration: Date.now() - startTime,
    });
    console.log('✗ GET /api/content/top-sellers - FAIL:', error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🧪 Running Integration Tests for YoForex API\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Run all tests
  await testGetCategories();
  await testGetThreads();
  await testGetStats();
  await testPostFeedback();
  await testGetNotificationsUnreadCount();
  await testGetBrokers();
  await testGetHot();
  await testGetTopSellers();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(50));
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  - ${r.endpoint}: ${r.error}`);
      });
  }
  
  console.log('\nDetailed Results:');
  console.table(results.map(r => ({
    Endpoint: r.endpoint,
    Method: r.method,
    Status: r.status,
    'Status Code': r.statusCode || '-',
    'Duration (ms)': r.duration || '-',
  })));
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
