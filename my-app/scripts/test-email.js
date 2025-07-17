// Test script to verify login alert email functionality
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmailSending() {
  try {
    console.log('📧 Testing email sending functionality...');
    
    // Check if email credentials are available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('❌ Email credentials not found in .env.local');
      return;
    }
    
    console.log(`📧 Email configured for: ${process.env.EMAIL_USER}`);
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Test email content
    const testDeviceInfo = {
      email: 'test@example.com',
      deviceId: 'test-device-123',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: 'Singapore'
    };

    const subject = "🚨 TEST: New login detected on your account";
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>🔐 TEST: Security Alert - New Login Detected</h2>
        </div>
        
        <div class="alert">
          <strong>⚠️ This is a TEST email for login alert functionality.</strong>
        </div>
        
        <div class="details">
          <h3>📋 Login Details:</h3>
          <ul>
            <li><strong>📅 Time:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>🌍 IP Address:</strong> ${testDeviceInfo.ipAddress}</li>
            <li><strong>📱 Device ID:</strong> ${testDeviceInfo.deviceId}</li>
            <li><strong>🔍 Browser/Device:</strong> ${testDeviceInfo.userAgent}</li>
            <li><strong>📍 Location:</strong> ${testDeviceInfo.location}</li>
          </ul>
        </div>
        
        <p>This is a test email to verify the login alert functionality is working correctly.</p>
      </body>
      </html>
    `;

    // Send test email to the configured email address
    const mailOptions = {
      from: `"Singapore Pallet Works Security" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: subject,
      html: htmlContent,
    };

    console.log('📤 Sending test email...');
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Test email sent successfully! Message ID: ${result.messageId}`);
    console.log(`📧 Email sent to: ${process.env.EMAIL_USER}`);
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    // Provide helpful troubleshooting information
    if (error.code === 'EAUTH') {
      console.log('\n💡 Troubleshooting EAUTH error:');
      console.log('1. Make sure you\'re using an App Password, not your regular Gmail password');
      console.log('2. Go to: https://myaccount.google.com/apppasswords');
      console.log('3. Generate a new App Password for "Mail"');
      console.log('4. Update EMAIL_PASSWORD in .env.local with the App Password');
    }
  }
}

testEmailSending();
