import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

interface PerformanceResult {
  endpoint: string;
  duration: number;
  status: 'PASS' | 'FAIL' | 'ERROR';
  statusCode?: number;
  error?: string;
}

async function measureAPIPerformance(): Promise<void> {
  const endpoints = [
    '/api/dashboard/overview',
    '/api/dashboard/earnings-sources',
    '/api/dashboard/loyalty-timeline',
    '/api/dashboard/badges',
    '/api/dashboard/vault/summary',
    '/api/me',
  ];

  console.log('🚀 Performance Audit Results:\n');
  console.log('=' .repeat(70));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Target: <500ms per endpoint`);
  console.log('=' .repeat(70) + '\n');

  const results: PerformanceResult[] = [];
  let passCount = 0;
  let failCount = 0;
  let errorCount = 0;

  for (const endpoint of endpoints) {
    const start = Date.now();
    try {
      const response = await axios.get(BASE_URL + endpoint, {
        timeout: 5000,
        validateStatus: () => true, // Don't throw on any status
      });
      const duration = Date.now() - start;
      const status = duration < 500 ? 'PASS' : 'FAIL';
      
      const result: PerformanceResult = {
        endpoint,
        duration,
        status,
        statusCode: response.status,
      };

      results.push(result);

      if (status === 'PASS') {
        passCount++;
        console.log(`✅ ${endpoint.padEnd(40)} ${duration}ms (${status})`);
      } else {
        failCount++;
        console.log(`❌ ${endpoint.padEnd(40)} ${duration}ms (${status} - >500ms)`);
      }
    } catch (error: any) {
      errorCount++;
      const duration = Date.now() - start;
      const result: PerformanceResult = {
        endpoint,
        duration,
        status: 'ERROR',
        error: error.message,
      };
      results.push(result);
      console.log(`❌ ${endpoint.padEnd(40)} ERROR: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(70));
  console.log('📊 Summary:');
  console.log('=' .repeat(70));
  console.log(`Total Endpoints: ${endpoints.length}`);
  console.log(`✅ Passed: ${passCount} (${((passCount / endpoints.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failCount} (${((failCount / endpoints.length) * 100).toFixed(1)}%)`);
  console.log(`⚠️  Errors: ${errorCount} (${((errorCount / endpoints.length) * 100).toFixed(1)}%)`);
  
  const avgDuration = results
    .filter(r => r.status !== 'ERROR')
    .reduce((sum, r) => sum + r.duration, 0) / (results.length - errorCount || 1);
  
  console.log(`📈 Average Response Time: ${avgDuration.toFixed(2)}ms`);
  console.log('=' .repeat(70));

  // Recommendations
  console.log('\n💡 Recommendations:');
  const slowEndpoints = results.filter(r => r.duration > 500 && r.status !== 'ERROR');
  if (slowEndpoints.length > 0) {
    console.log('\nSlow endpoints that need optimization:');
    slowEndpoints.forEach(r => {
      console.log(`  - ${r.endpoint}: ${r.duration}ms`);
    });
  } else {
    console.log('  All endpoints are performing within acceptable limits! 🎉');
  }

  if (errorCount > 0) {
    console.log('\nEndpoints with errors:');
    results
      .filter(r => r.status === 'ERROR')
      .forEach(r => {
        console.log(`  - ${r.endpoint}: ${r.error}`);
      });
  }

  console.log('\n');

  // Exit with appropriate code
  process.exit(failCount + errorCount > 0 ? 1 : 0);
}

// Run the audit
measureAPIPerformance().catch((error) => {
  console.error('Fatal error during performance audit:', error);
  process.exit(1);
});
