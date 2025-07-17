import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import mongoose from "mongoose";

// GET /api/2fa-raw/test - Test current TOTP token for debugging
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("🧪 Testing 2FA tokens for user:", email);

    // Connect to database
    await connectToDatabase();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: "User doesn't have 2FA secret" },
        { status: 400 }
      );
    }

    // Generate current tokens for the next 5 time steps
    const currentTime = Math.floor(Date.now() / 1000);
    const tokens = [];
    
    for (let i = -2; i <= 2; i++) {
      const time = currentTime + (i * 30); // 30-second intervals
      const token = speakeasy.totp({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        time: time
      });
      tokens.push({
        timeOffset: i * 30,
        time: time,
        token: token,
        isCurrent: i === 0
      });
    }

    console.log("🧪 Generated test tokens:", tokens);

    return NextResponse.json({
      user: user.email,
      secret: user.twoFactorSecret.substring(0, 8) + "...",
      fullSecret: user.twoFactorSecret, // Full secret for debugging
      currentTime: currentTime,
      tokens: tokens,
      otpAuthUrl: `otpauth://totp/${encodeURIComponent(user.name + " (" + user.email + ")")}?secret=${user.twoFactorSecret}&issuer=${encodeURIComponent("Singapore Pallet Works")}`,
      message: "Use any of these tokens to test verification"
    });

  } catch (error) {
    console.error("❌ Error testing 2FA tokens:", error);
    return NextResponse.json(
      { error: "Failed to test 2FA tokens" },
      { status: 500 }
    );
  }
}
