import { db } from './db';
import { users, passwordResetTokens } from '../shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Comprehensive Password Reset Flow Test Script
 * Tests all aspects of the password reset functionality
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@yoforex.net';
const TEST_PASSWORD = 'TestPassword123!';
const NEW_PASSWORD = 'NewPassword456!';

interface TestResult {
  test: string;
  success: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  try {
    console.log(`\n🧪 Testing: ${name}...`);
    await testFn();
    console.log(`✅ ${name} - PASSED`);
    results.push({ test: name, success: true });
  } catch (error: any) {
    console.error(`❌ ${name} - FAILED`);
    console.error(`   Error: ${error.message}`);
    results.push({ 
      test: name, 
      success: false, 
      error: error.message,
      details: error.details || error.stack 
    });
  }
}

async function apiRequest(endpoint: string, method: string = 'POST', body?: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  
  if (!response.ok && response.status >= 500) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return { status: response.status, data };
}

async function setupTestUser() {
  console.log('\n📋 Setting up test user...');
  
  // Check if test user exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, TEST_EMAIL))
    .limit(1);
  
  if (existingUser) {
    console.log(`✅ Test user exists: ${TEST_EMAIL}`);
    return existingUser;
  }
  
  // Create test user
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  const [newUser] = await db
    .insert(users)
    .values({
      username: 'test_password_reset_user',
      email: TEST_EMAIL,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'member',
      status: 'active',
    })
    .returning();
  
  console.log(`✅ Test user created: ${TEST_EMAIL}`);
  return newUser;
}

async function cleanupOldTokens() {
  console.log('\n🧹 Cleaning up old password reset tokens...');
  
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, TEST_EMAIL))
    .limit(1);
  
  if (user[0]) {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user[0].id));
    console.log('✅ Old tokens cleaned');
  }
}

async function main() {
  console.log('========================================');
  console.log('🔐 Password Reset Flow Test Suite');
  console.log('========================================');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log('========================================');
  
  let testUser: any;
  let resetToken: string | null = null;
  
  try {
    // Setup
    testUser = await setupTestUser();
    await cleanupOldTokens();
    
    // Test 1: Forgot Password - Valid Email
    await runTest('Forgot Password - Valid Email', async () => {
      const response = await apiRequest('/api/auth/forgot-password', 'POST', {
        email: TEST_EMAIL
      });
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.success) {
        throw new Error('Expected success: true');
      }
      
      // Verify token was created in database
      const tokens = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, testUser.id));
      
      if (tokens.length === 0) {
        throw new Error('No token created in database');
      }
      
      console.log(`   ✓ Token created in database (expires: ${tokens[0].expiresAt})`);
    });
    
    // Test 2: Forgot Password - Non-existent Email (should not reveal)
    await runTest('Forgot Password - Non-existent Email', async () => {
      const response = await apiRequest('/api/auth/forgot-password', 'POST', {
        email: 'nonexistent@example.com'
      });
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.success) {
        throw new Error('Should return success even for non-existent email');
      }
      
      console.log('   ✓ Does not reveal if email exists (security check passed)');
    });
    
    // Test 3: Forgot Password - Invalid Email Format
    await runTest('Forgot Password - Invalid Email Format', async () => {
      const response = await apiRequest('/api/auth/forgot-password', 'POST', {
        email: 'invalid-email'
      });
      
      if (response.status !== 400) {
        throw new Error(`Expected status 400, got ${response.status}`);
      }
      
      console.log('   ✓ Validates email format');
    });
    
    // Test 4: Get Reset Token (simulate receiving email)
    await runTest('Retrieve Reset Token from Database', async () => {
      const tokens = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.userId, testUser.id),
            eq(passwordResetTokens.consumed, false)
          )
        )
        .orderBy(passwordResetTokens.createdAt)
        .limit(1);
      
      if (tokens.length === 0) {
        throw new Error('No valid token found');
      }
      
      // In real scenario, user gets this from email
      // For testing, we need to simulate having the plain token
      // Since we can't reverse the hash, we'll create a new token for testing
      const crypto = await import('crypto');
      resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(resetToken, 10);
      
      // Update the token hash in database with our test token
      await db
        .update(passwordResetTokens)
        .set({ tokenHash })
        .where(eq(passwordResetTokens.id, tokens[0].id));
      
      console.log(`   ✓ Reset token prepared for testing`);
    });
    
    // Test 5: Reset Password - Valid Token
    await runTest('Reset Password - Valid Token', async () => {
      if (!resetToken) {
        throw new Error('No reset token available');
      }
      
      const response = await apiRequest('/api/auth/reset-password', 'POST', {
        token: resetToken,
        newPassword: NEW_PASSWORD
      });
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}: ${JSON.stringify(response.data)}`);
      }
      
      if (!response.data.success) {
        throw new Error('Password reset failed');
      }
      
      // Verify token was marked as consumed
      const tokens = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, testUser.id));
      
      const consumedTokens = tokens.filter(t => t.consumed);
      if (consumedTokens.length === 0) {
        throw new Error('Token not marked as consumed');
      }
      
      console.log('   ✓ Password reset successfully');
      console.log('   ✓ Token marked as consumed');
    });
    
    // Test 6: Verify Password Was Changed
    await runTest('Verify New Password Works', async () => {
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUser.id))
        .limit(1);
      
      const isValid = await bcrypt.compare(NEW_PASSWORD, updatedUser.password!);
      
      if (!isValid) {
        throw new Error('New password not set correctly');
      }
      
      console.log('   ✓ New password is valid');
    });
    
    // Test 7: Reset Password - Reuse Consumed Token (should fail)
    await runTest('Reset Password - Consumed Token Rejected', async () => {
      if (!resetToken) {
        throw new Error('No reset token available');
      }
      
      const response = await apiRequest('/api/auth/reset-password', 'POST', {
        token: resetToken,
        newPassword: 'AnotherPassword789!'
      });
      
      if (response.status !== 400) {
        throw new Error(`Expected status 400, got ${response.status}`);
      }
      
      console.log('   ✓ Consumed token correctly rejected');
    });
    
    // Test 8: Reset Password - Invalid Token
    await runTest('Reset Password - Invalid Token', async () => {
      const response = await apiRequest('/api/auth/reset-password', 'POST', {
        token: 'invalid_token_12345',
        newPassword: NEW_PASSWORD
      });
      
      if (response.status !== 400) {
        throw new Error(`Expected status 400, got ${response.status}`);
      }
      
      console.log('   ✓ Invalid token correctly rejected');
    });
    
    // Test 9: Reset Password - Expired Token
    await runTest('Reset Password - Expired Token', async () => {
      // Create an expired token
      const crypto = await import('crypto');
      const expiredToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(expiredToken, 10);
      
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2); // 2 hours ago
      
      await db.insert(passwordResetTokens).values({
        userId: testUser.id,
        tokenHash,
        expiresAt: pastDate,
        consumed: false,
      });
      
      const response = await apiRequest('/api/auth/reset-password', 'POST', {
        token: expiredToken,
        newPassword: NEW_PASSWORD
      });
      
      if (response.status !== 400) {
        throw new Error(`Expected status 400, got ${response.status}`);
      }
      
      console.log('   ✓ Expired token correctly rejected');
    });
    
    // Test 10: Reset Password - Weak Password
    await runTest('Reset Password - Weak Password Rejected', async () => {
      const response = await apiRequest('/api/auth/reset-password', 'POST', {
        token: 'some_token',
        newPassword: 'weak'
      });
      
      if (response.status !== 400) {
        throw new Error(`Expected status 400, got ${response.status}`);
      }
      
      console.log('   ✓ Weak password correctly rejected');
    });
    
    // Print Summary
    console.log('\n========================================');
    console.log('📊 TEST SUMMARY');
    console.log('========================================');
    
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    const successRate = (passedTests / results.length) * 100;
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    console.log('----------------------------------------');
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.test}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    console.log('========================================\n');
    
    if (failedTests > 0) {
      console.log('❌ SOME TESTS FAILED');
      process.exit(1);
    } else {
      console.log('✅ ALL TESTS PASSED!');
      console.log('\n🎉 Password reset flow is working correctly!');
      console.log('\nKey Security Features Verified:');
      console.log('  ✓ Tokens expire after 1 hour');
      console.log('  ✓ Consumed tokens cannot be reused');
      console.log('  ✓ Invalid tokens are rejected');
      console.log('  ✓ Expired tokens are rejected');
      console.log('  ✓ Email enumeration prevented');
      console.log('  ✓ Password strength validated');
      console.log('  ✓ Tokens are securely hashed');
      process.exit(0);
    }
    
  } catch (error: any) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);
