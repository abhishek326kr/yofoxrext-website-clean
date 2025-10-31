import { emailService } from './services/emailService';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Comprehensive SMTP Testing Script
 * Tests all email templates and SMTP connectivity
 */

interface TestResult {
  template: string;
  success: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

// Test email address - update this to your test email
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@yoforex.net';
const TEST_USERNAME = 'test_user';

console.log('========================================');
console.log('📧 YoForex SMTP Comprehensive Test');
console.log('========================================');
console.log(`Test Email: ${TEST_EMAIL}`);
console.log(`BASE_URL: ${process.env.BASE_URL || 'NOT SET'}`);
console.log(`SMTP Host: ${process.env.SMTP_HOST || 'smtp.hostinger.com'}`);
console.log(`SMTP Port: ${process.env.SMTP_PORT || '465'}`);
console.log(`SMTP User: ${process.env.SMTP_USER || 'NOT SET'}`);
console.log('========================================\n');

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    console.log(`🧪 Testing: ${name}...`);
    await testFn();
    const duration = Date.now() - startTime;
    console.log(`✅ ${name} - SUCCESS (${duration}ms)\n`);
    results.push({ template: name, success: true, duration });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${name} - FAILED (${duration}ms)`);
    console.error(`   Error: ${error.message}\n`);
    results.push({ 
      template: name, 
      success: false, 
      error: error.message,
      duration 
    });
  }
}

async function main() {
  try {
    // Test 1: Email Verification
    await runTest('Email Verification Template', async () => {
      const verificationToken = 'test_verification_token_' + Date.now();
      await emailService.sendEmailVerification(
        TEST_EMAIL,
        TEST_USERNAME,
        verificationToken
      );
    });

    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Password Reset
    await runTest('Password Reset Template', async () => {
      const resetToken = 'test_reset_token_' + Date.now();
      await emailService.sendPasswordReset(
        TEST_EMAIL,
        resetToken,
        '1 hour'
      );
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Coins Received
    await runTest('Coins Received Notification', async () => {
      await emailService.sendCoinsReceived(
        TEST_EMAIL,
        50,
        'Test Purchase',
        150
      );
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Product Sold
    await runTest('Product Sold Notification', async () => {
      await emailService.sendProductSold(
        TEST_EMAIL,
        'Test EA - Gold Scalper Pro',
        'TestBuyer123',
        100,
        85
      );
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Comment Notification
    await runTest('Comment Notification', async () => {
      await emailService.sendCommentNotification(
        TEST_EMAIL,
        'John Trader',
        'Best Gold EA for 2025',
        'This is an amazing EA! I\'ve been using it for 2 weeks and already seeing great results.',
        'best-gold-ea-for-2025'
      );
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 6: Welcome Email
    await runTest('Welcome Email', async () => {
      await emailService.sendWelcomeEmail(
        TEST_EMAIL,
        TEST_USERNAME
      );
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 7: Product Published
    await runTest('Product Published Notification', async () => {
      await emailService.sendProductPublished(
        TEST_EMAIL,
        'Gold Scalper EA Pro',
        'Expert Advisor',
        'gold-scalper-ea-pro'
      );
    });

    // Print Summary
    console.log('\n========================================');
    console.log('📊 TEST SUMMARY');
    console.log('========================================');
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📈 Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    console.log('----------------------------------------');
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.template} (${result.duration}ms)`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    console.log('========================================\n');

    if (failureCount > 0) {
      console.log('⚠️  SMTP ISSUES DETECTED:');
      console.log('----------------------------------------');
      
      const hasAuthError = results.some(r => r.error?.includes('authentication') || r.error?.includes('Invalid login'));
      const hasConnectionError = results.some(r => r.error?.includes('ECONNREFUSED') || r.error?.includes('ETIMEDOUT'));
      const hasMissingConfig = !process.env.SMTP_USER || !process.env.SMTP_PASSWORD;
      
      if (hasMissingConfig) {
        console.log('❌ Missing SMTP credentials (SMTP_USER or SMTP_PASSWORD)');
      }
      if (hasAuthError) {
        console.log('❌ SMTP authentication failed - check credentials');
      }
      if (hasConnectionError) {
        console.log('❌ Cannot connect to SMTP server - check host and port');
      }
      if (!process.env.BASE_URL) {
        console.log('⚠️  BASE_URL is not set - email links may not work');
      }
      
      console.log('========================================\n');
      process.exit(1);
    } else {
      console.log('✅ ALL TESTS PASSED - SMTP is configured correctly!\n');
      console.log('📧 Check your inbox at: ' + TEST_EMAIL);
      console.log('   You should have received 7 test emails.\n');
      process.exit(0);
    }

  } catch (error: any) {
    console.error('❌ Fatal Error:', error.message);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);
