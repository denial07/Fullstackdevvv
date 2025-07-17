import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Function to hash reset token (same as in other routes)
function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// GET /api/reset-password/validate - Check if reset token is valid and get expiry
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Hash the provided token to match stored hash
    const hashedToken = hashResetToken(token);

    // Find user with matching email and reset token (don't check expiry yet)
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: hashedToken
    });

    if (!user || !user.resetPasswordExpiry) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiry = new Date(user.resetPasswordExpiry);
    const isExpired = now > expiry;
    const timeRemaining = isExpired ? 0 : expiry.getTime() - now.getTime();

    return NextResponse.json({
      isValid: !isExpired,
      expiryTime: expiry.toISOString(),
      timeRemaining: Math.max(0, timeRemaining),
      currentTime: now.toISOString()
    });

  } catch (error) {
    console.error("❌ Token validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate token" },
      { status: 500 }
    );
  }
}
