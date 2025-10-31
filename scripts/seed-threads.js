const fs = require('fs');
const https = require('https');
const http = require('http');

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const API_TOKEN = process.env.API_TOKEN || ''; // Set if API requires authentication
const JSONL_FILE = './scripts/seed-threads-data.jsonl';
const DELAY_MS = 1000; // Throttle: 1 second between requests

// Helper to make HTTP requests
function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (API_TOKEN) {
      options.headers['Authorization'] = `Bearer ${API_TOKEN}`;
    }
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body: body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main seeding function
async function seedThreads() {
  console.log('🌱 Starting thread seeding...');
  console.log(`📦 Reading threads from: ${JSONL_FILE}`);
  
  try {
    const fileContent = fs.readFileSync(JSONL_FILE, 'utf-8');
    const lines = fileContent.trim().split('\n');
    const threads = lines.map(line => JSON.parse(line));
    
    console.log(`📝 Found ${threads.length} threads to seed\n`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const [index, thread] of threads.entries()) {
      try {
        console.log(`[${index + 1}/${threads.length}] Posting: "${thread.title.substring(0, 50)}..."`);
        
        // Note: This is a placeholder - adjust the API endpoint and payload structure
        // based on your actual thread creation API
        const payload = {
          title: thread.title,
          body: thread.body,
          categorySlug: thread.categorySlug,
          // Add other fields as needed by your API
        };
        
        const response = await makeRequest(
          `${API_BASE}/api/threads`,
          'POST',
          payload
        );
        
        console.log(`✅ Success: ${thread.title.substring(0, 40)}...`);
        successCount++;
        
        // Throttle requests
        if (index < threads.length - 1) {
          await delay(DELAY_MS);
        }
      } catch (error) {
        console.error(`❌ Failed: ${error.message}`);
        failureCount++;
      }
    }
    
    console.log(`\n🎉 Seeding complete!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  console.log('📌 Thread Seeding Script');
  console.log(`🌐 API Base: ${API_BASE}`);
  console.log(`⏱️  Throttle: ${DELAY_MS}ms between requests\n`);
  
  seedThreads()
    .then(() => {
      console.log('\n✨ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedThreads };
