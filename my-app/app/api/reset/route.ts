import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import nodemailer from "nodemailer";

// Generate reset token
function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

// Hash reset token for storage
function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// POST /api/reset - Request password reset
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Always return success for security (don't reveal if email exists)
    if (!user) {
      console.log("🔍 Password reset requested for non-existent email:", email);
      return NextResponse.json({
        message: "If an account with that email exists, a reset link has been sent."
      });
    }

    // Generate reset token and expiry (1 hour from now)
    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token and expiry
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: resetExpiry
    });

    console.log("🔑 Password reset token generated for:", email);

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Reset email
    const resetEmail = {
      from: process.env.EMAIL_USER || 'noreply@palletworks.sg',
      to: email,
      subject: '🔑 Reset Your Password - Singapore Pallet Works',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            Password Reset Request
          </h2>
          
          <p>Hello ${user.name},</p>
          
          <p>We received a request to reset your password for your Singapore Pallet Works Dashboard account.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <p style="margin: 0; color: #166534;">
              <strong>Click the button below to reset your password:</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Important:</strong><br>
              • This link will expire in 1 hour<br>
              • If you didn't request this reset, please ignore this email<br>
              • For security, never share this link with anyone
            </p>
          </div>
          
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
            ${resetUrl}
          </p>
          
          <p>Best regards,<br>
          Singapore Pallet Works Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };

    try {
      // Send reset email
      await transporter.sendMail(resetEmail);
      console.log("📧 Password reset email sent to:", email);
    } catch (emailError) {
      console.error("❌ Failed to send reset email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent."
    });

  } catch (error) {
    console.error("❌ Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}

// PUT /api/reset - Update password with reset token
export async function PUT(req: NextRequest) {
  try {
    const { token, email, newPassword } = await req.json();

    // Validate input
    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { error: "Token, email, and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Hash the provided token to compare with stored hash
    const hashedToken = hashResetToken(token);

    // Find user with valid reset token
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() } // Token not expired
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Update password and clear reset token
    await User.findByIdAndUpdate(user._id, {
      password: newPassword, // In production, hash this properly
      resetPasswordToken: undefined,
      resetPasswordExpiry: undefined
    });

    console.log("✅ Password reset successful for:", email);

    return NextResponse.json({
      message: "Password reset successful"
    });

  } catch (error) {
    console.error("❌ Password update error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
