import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import nodemailer from 'nodemailer';

interface LoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  deviceId: string;
  location?: string;
}

// Helper function to generate device ID from user agent and other factors
function generateDeviceId(userAgent: string, ipAddress: string): string {
  const combined = `${userAgent}-${ipAddress}`;
  // Simple hash function for device identification
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Helper function to send email notification
async function sendLoginAlertEmail(email: string, deviceInfo: LoginAttempt) {
  console.log(`🔔 Sending login alert email to: ${email}`);
  console.log(`📱 Device: ${deviceInfo.deviceId}`);
  console.log(`🌍 IP: ${deviceInfo.ipAddress}`);
  
  try {
    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const subject = "New login detected on your account";
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Security Alert: New Login Detected</h2>
        </div>
        
        <p>Hello,</p>
        
        <div class="alert">
          <strong>A new login was detected on your account.</strong>
        </div>
        
        <p>We detected a login to your account from a new device or location. Here are the details:</p>
        
        <div class="details">
          <h3>Login Details:</h3>
          <ul>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>IP Address:</strong> ${deviceInfo.ipAddress}</li>
            <li><strong>Device ID:</strong> ${deviceInfo.deviceId}</li>
            <li><strong>Browser/Device:</strong> ${deviceInfo.userAgent}</li>
            <li><strong>Location:</strong> ${deviceInfo.location || 'Unknown'}</li>
          </ul>
        </div>
        
        <h3>What should you do?</h3>
        <p><strong>If this was you:</strong> You can safely ignore this email. This device has been added to your trusted devices.</p>
        
        <p><strong>If this was NOT you:</strong></p>
        <ul>
          <li>Change your password immediately</li>
          <li>Review your account for any unauthorized changes</li>
          <li>Enable two-factor authentication if you haven't already</li>
          <li>Contact support if you need assistance</li>
        </ul>
        
        <a href="http://localhost:3000/settings" class="button">Manage Security Settings</a>
        
        <div class="footer">
          <p>This is an automated security notification from Singapore Pallet Works.</p>
          <p>You can manage your login alert preferences in your account settings.</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Security Alert: New Login Detected
      
      A new login was detected on your account:
      
      Time: ${new Date().toLocaleString()}
      IP Address: ${deviceInfo.ipAddress}
      Device ID: ${deviceInfo.deviceId}
      Browser/Device: ${deviceInfo.userAgent}
      Location: ${deviceInfo.location || 'Unknown'}
      
      If this was you, you can ignore this email. If you don't recognize this login, please secure your account immediately.
      
      - Singapore Pallet Works Security Team
    `;

    // Send email
    const mailOptions = {
      from: `"Singapore Pallet Works Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Login alert email sent successfully to ${email}:`, result.messageId);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to send login alert email to ${email}:`, error);
    throw error;
  }
}

// POST /api/login-alert - Check for new device and send alert if needed
export async function POST(req: NextRequest) {
  try {
    console.log("🔔 LOGIN ALERT API CALLED");
    const { email, ipAddress, userAgent } = await req.json();
    
    console.log(`📋 Login alert request:`, { email, ipAddress, userAgent: userAgent?.substring(0, 50) });
    
    if (!email || !ipAddress || !userAgent) {
      console.log("❌ Missing required fields for login alert");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`⚠️ User not found for login alert: ${email}`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if login alerts are enabled (fail gracefully if field doesn't exist)
    if (user.loginAlerts === false) {
      console.log(`📴 Login alerts disabled for user: ${email}`);
      return NextResponse.json({
        message: "Login alerts disabled",
        newDevice: false
      });
    }

    // Generate device ID
    const deviceId = generateDeviceId(userAgent, ipAddress);
    
    // Check if this is a trusted device (with error handling)
    const trustedDevices = user.trustedDevices || [];
    const existingDevice = trustedDevices.find(device => 
      device.deviceId === deviceId || 
      (device.ipAddress === ipAddress && device.userAgent === userAgent)
    );

    if (existingDevice) {
      // Update last used time for existing device (non-blocking)
      try {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            "trustedDevices.$[elem].lastUsed": new Date()
          }
        }, {
          arrayFilters: [{ "elem.deviceId": deviceId }],
          timeout: 5000 // 5 second timeout
        });
        console.log(`✅ Updated last used time for trusted device: ${deviceId}`);
      } catch (updateError) {
        console.log(`⚠️ Failed to update device last used time (non-critical):`, updateError);
      }

      return NextResponse.json({
        message: "Trusted device",
        newDevice: false
      });
    }

    // This is a new device - send alert email
    const deviceInfo: LoginAttempt = {
      email,
      ipAddress,
      userAgent,
      deviceId,
      location: "Unknown" // You could integrate with IP geolocation service
    };

    // Send login alert email (with timeout)
    try {
      await Promise.race([
        sendLoginAlertEmail(email, deviceInfo),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email timeout')), 10000)
        )
      ]);
    } catch (emailError) {
      console.error(`⚠️ Failed to send login alert email (non-critical):`, emailError);
      // Continue anyway - don't fail the login
    }

    // Add this device to trusted devices (with error handling)
    try {
      await User.findByIdAndUpdate(user._id, {
        $push: {
          trustedDevices: {
            deviceId,
            ipAddress,
            userAgent,
            location: deviceInfo.location,
            lastUsed: new Date()
          }
        }
      }, {
        timeout: 5000 // 5 second timeout
      });
      console.log(`✅ Added new trusted device: ${deviceId} for ${email}`);
    } catch (deviceAddError) {
      console.error(`⚠️ Failed to add trusted device (non-critical):`, deviceAddError);
      // Continue anyway
    }

    console.log(`✅ Login alert sent for new device: ${deviceId} (${email})`);

    return NextResponse.json({
      message: "Login alert sent for new device",
      newDevice: true,
      deviceId
    });

  } catch (error) {
    console.error("⚠️ Login alert error (non-critical):", error);
    
    // Return a success response even if login alert fails
    // This ensures login process is never blocked by alert failures
    return NextResponse.json({
      message: "Login alert processing failed but login continues",
      newDevice: false,
      error: "Non-critical alert processing error"
    }, { status: 200 }); // Return 200 instead of 500 to not block login
  }
}
