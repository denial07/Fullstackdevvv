import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import mongoose from "mongoose";

// POST /api/2fa-raw/setup - Generate 2FA secret and QR code using raw MongoDB
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("🔐 Setting up 2FA for user (RAW):", email);

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

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${user.name} (${user.email})`,
      issuer: "Singapore Pallet Works",
      length: 32
    });

    console.log("🔍 Generated secret details:");
    console.log("🔍 - Base32 secret:", secret.base32);
    console.log("🔍 - OTP Auth URL:", secret.otpauth_url);
    console.log("🔍 - Manual entry key:", secret.base32);

    // Generate a test token to verify the secret works
    const testToken = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32'
    });
    console.log("🔍 - Test token generated:", testToken);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Use raw MongoDB to update the user
    const updateResult = await usersCollection.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          twoFactorSecret: secret.base32,
          twoFactorEnabled: false,
          twoFactorBackupCodes: []
        }
      }
    );

    console.log("🔍 Raw update result:", updateResult.modifiedCount);
    console.log("🔍 Secret being saved:", secret.base32.substring(0, 8) + "...");

    // Verify the secret was saved
    const verifyUser = await usersCollection.findOne({ email: email.toLowerCase() });
    console.log("🔍 After save verification (RAW):");
    console.log("🔍 - User found:", !!verifyUser);
    console.log("🔍 - twoFactorEnabled:", verifyUser?.twoFactorEnabled);
    console.log("🔍 - twoFactorSecret exists:", !!verifyUser?.twoFactorSecret);
    if (verifyUser?.twoFactorSecret) {
      console.log("🔍 - Secret starts with:", verifyUser.twoFactorSecret.substring(0, 8) + "...");
    }

    console.log("✅ 2FA secret generated for user (RAW):", email);

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });

  } catch (error) {
    console.error("❌ Error setting up 2FA (RAW):", error);
    return NextResponse.json(
      { error: "Failed to setup 2FA" },
      { status: 500 }
    );
  }
}

// PUT /api/2fa-raw/setup - Enable/disable 2FA after verification using raw MongoDB
export async function PUT(req: NextRequest) {
  try {
    const { email, token, enable } = await req.json();

    if (!email || !token || typeof enable !== 'boolean') {
      return NextResponse.json(
        { error: "Email, token, and enable flag are required" },
        { status: 400 }
      );
    }

    // Sanitize token
    const cleanToken = String(token).replace(/\s/g, '');
    
    if (enable && (!cleanToken || cleanToken.length < 6)) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit verification code" },
        { status: 400 }
      );
    }
    
    console.log("🔐 Enabling/disabling 2FA for user (RAW):", email);
    console.log("🔍 Clean token:", cleanToken, "Length:", cleanToken.length);

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

    console.log("🔍 Found user for 2FA enable (RAW):", user.email);
    console.log("🔍 User has 2FA secret:", !!user.twoFactorSecret);
    console.log("🔍 User 2FA enabled:", user.twoFactorEnabled);

    if (enable) {
      // Verify the token before enabling
      if (!user.twoFactorSecret) {
        console.log("❌ 2FA secret not found for user (RAW):", email);
        return NextResponse.json(
          { error: "2FA secret not found. Please setup 2FA first." },
          { status: 400 }
        );
      }

      console.log("🔍 Verifying token (RAW):", cleanToken);
      console.log("🔍 Secret being used for verification:", user.twoFactorSecret.substring(0, 8) + "...");
      
      // Add more detailed debugging
      const currentTime = Math.floor(Date.now() / 1000);
      const currentToken = speakeasy.totp({
        secret: user.twoFactorSecret,
        encoding: 'base32'
      });
      
      console.log("🔍 Current time:", currentTime);
      console.log("🔍 Expected current token:", currentToken);
      console.log("🔍 User provided token:", cleanToken);

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: cleanToken,
        window: 2,
        time: currentTime
      });

      console.log("🔍 Token verification result (RAW):", verified);
      
      if (!verified) {
        console.log("🔍 Trying verification with wider window...");
        const verifiedWide = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: cleanToken,
          window: 10
        });
        console.log("🔍 Wide window verification result:", verifiedWide);
        
        if (verifiedWide) {
          console.log("✅ Token verified with wider window");
        } else {
          console.log("❌ Token failed even with wide window");
          
          // Generate a few tokens around current time for debugging
          const currentTime = Math.floor(Date.now() / 1000);
          const debugTokens = [];
          for (let i = -3; i <= 3; i++) {
            const time = currentTime + (i * 30);
            const token = speakeasy.totp({
              secret: user.twoFactorSecret,
              encoding: 'base32',
              time: time
            });
            debugTokens.push(`${i * 30}s: ${token}`);
          }
          console.log("🔍 Expected tokens:", debugTokens.join(", "));
          
          return NextResponse.json(
            { 
              error: "Invalid 2FA token", 
              debug: {
                provided: cleanToken,
                expected: debugTokens,
                hint: "Check your authenticator app's time sync"
              }
            },
            { status: 400 }
          );
        }
      }

      // Generate backup codes
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
      }

      // Update user with raw MongoDB
      const updateResult = await usersCollection.updateOne(
        { email: email.toLowerCase() },
        {
          $set: {
            twoFactorEnabled: true,
            twoFactorBackupCodes: backupCodes
          }
        }
      );

      console.log("🔍 Enable update result (RAW):", updateResult.modifiedCount);
      console.log("✅ 2FA enabled for user (RAW):", email);

      return NextResponse.json({
        message: "2FA enabled successfully",
        backupCodes: backupCodes
      });
    } else {
      // Disable 2FA
      const updateResult = await usersCollection.updateOne(
        { email: email.toLowerCase() },
        {
          $set: {
            twoFactorEnabled: false,
            twoFactorBackupCodes: []
          },
          $unset: {
            twoFactorSecret: ""
          }
        }
      );

      console.log("🔍 Disable update result (RAW):", updateResult.modifiedCount);
      console.log("✅ 2FA disabled for user (RAW):", email);

      return NextResponse.json({
        message: "2FA disabled successfully"
      });
    }

  } catch (error) {
    console.error("❌ Error enabling/disabling 2FA (RAW):", error);
    return NextResponse.json(
      { error: "Failed to update 2FA settings" },
      { status: 500 }
    );
  }
}
