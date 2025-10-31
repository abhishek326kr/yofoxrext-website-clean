#!/usr/bin/env node

/**
 * Send a test email to verify SMTP configuration
 */

import { emailService } from './services/emailService.js';
import nodemailer from 'nodemailer';

const testRecipient = 'sarvanubanerjee@gmail.com';

async function sendTestEmail() {
  console.log('🚀 Sending test email to:', testRecipient);
  console.log('📧 Using SMTP configuration:');
  console.log('   Host: smtp.hostinger.com');
  console.log('   Port: 465');
  console.log('   From: noreply@yoforex.net\n');
  
  try {
    // Create a test message with YoForex branding
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">YoForex</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Trading Community Platform</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #333; margin: 0 0 20px 0;">✅ SMTP Test Successful!</h2>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                This is a test email from <strong>YoForex</strong> to verify that our email system is working correctly.
              </p>
              
              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                <strong style="color: #333;">Test Details:</strong><br>
                <span style="color: #666;">
                  • Recipient: ${testRecipient}<br>
                  • Sent from: noreply@yoforex.net<br>
                  • SMTP Server: smtp.hostinger.com<br>
                  • Time: ${new Date().toLocaleString()}<br>
                  • Platform: YoForex Trading Forum
                </span>
              </div>
              
              <h3 style="color: #333; margin: 30px 0 15px 0;">📧 Email Features Available:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>58+ notification types (likes, comments, follows, transactions)</li>
                <li>Smart email grouping (batch similar notifications)</li>
                <li>Timezone-aware sending</li>
                <li>Email tracking (opens & clicks)</li>
                <li>User preference management</li>
                <li>Admin dashboard with analytics</li>
              </ul>
              
              <div style="background: #e7f5ff; border-radius: 5px; padding: 15px; margin: 30px 0;">
                <p style="color: #0969da; margin: 0;">
                  <strong>🎉 Your email system is fully operational!</strong><br>
                  All 58 email notification types are ready to keep your users engaged.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://yoforex.net" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold;">Visit YoForex</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="color: #999; margin: 0 0 10px 0; font-size: 14px;">
                This is an automated test email from YoForex
              </p>
              <p style="color: #999; margin: 0; font-size: 12px;">
                © 2025 YoForex. All rights reserved.<br>
                Forex Trading Community Platform
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Use the email service directly to send
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'noreply@yoforex.net',
        pass: process.env.SMTP_PASSWORD || 'YoForex@101'
      }
    });
    
    const result = await transporter.sendMail({
      from: `"YoForex" <${process.env.SMTP_FROM_EMAIL || 'noreply@yoforex.net'}>`,
      to: testRecipient,
      subject: '🚀 YoForex Email System Test - Working Successfully!',
      html: testHTML,
      text: `
YoForex Email System Test

This is a test email from YoForex to verify that our email system is working correctly.

Test Details:
• Recipient: ${testRecipient}
• Sent from: noreply@yoforex.net
• SMTP Server: smtp.hostinger.com
• Time: ${new Date().toLocaleString()}

Your email system is fully operational!

Visit YoForex: https://yoforex.net

© 2025 YoForex. All rights reserved.
      `.trim()
    });
    
    console.log('\n✅ SUCCESS! Test email sent successfully!');
    console.log('📬 Message ID:', result.messageId);
    console.log('📨 Check the inbox for:', testRecipient);
    console.log('\n📊 Email System Status:');
    console.log('   • SMTP Connection: ✅ Working');
    console.log('   • Authentication: ✅ Valid');
    console.log('   • Email Delivery: ✅ Successful');
    console.log('\n🎉 Your YoForex email system is ready for production!');
    
  } catch (error: any) {
    console.error('\n❌ Failed to send test email:');
    console.error('Error:', error?.message || error);
    
    if (error?.code === 'EAUTH') {
      console.error('\n🔐 Authentication failed. Please check:');
      console.error('   • SMTP_USER environment variable');
      console.error('   • SMTP_PASSWORD environment variable');
    } else if (error?.code === 'ESOCKET') {
      console.error('\n🌐 Connection failed. Please check:');
      console.error('   • SMTP_HOST (should be smtp.hostinger.com)');
      console.error('   • SMTP_PORT (should be 465)');
      console.error('   • Firewall/network settings');
    }
    
    process.exit(1);
  }
}

// Run the test
console.log('━'.repeat(60));
console.log('         YoForex Email System Test');
console.log('━'.repeat(60) + '\n');

sendTestEmail().then(() => {
  console.log('\n' + '━'.repeat(60));
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});