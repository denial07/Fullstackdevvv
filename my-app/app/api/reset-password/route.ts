import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Function to hash reset token (same as in reset route)
function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/reset-password - Reset password with token
export async function POST(req: NextRequest) {
  try {
    const { token, email, newPassword } = await req.json();

    // Validate input
    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { error: "Token, email, and new password are required" },
        { status: 400 }
      );
    }
    
    // Clean up token - remove any potential URL encoding issues
    const cleanToken = decodeURIComponent(token.trim());

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Hash the provided token to match stored hash
    const hashedToken = hashResetToken(cleanToken);

    // Find user with matching email and valid reset token
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() } // Token must not be expired
    });

    if (!user) {
      console.log("🔍 Invalid or expired reset token for:", email);
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    console.log("🔑 Valid reset token found for:", email);

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear reset token fields
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpiry: undefined
    });

    console.log("✅ Password updated successfully for:", email);

    return NextResponse.json({
      message: "Password reset successful",
      success: true
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
