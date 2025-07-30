import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import mongoose from "mongoose";

// POST /api/2fa-raw/verify - Verify 2FA token during login
export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and token are required" },
        { status: 400 }
      );
    }

    // Sanitize token
    const cleanToken = String(token).replace(/\s/g, '').toUpperCase();

    console.log("🔐 Verifying 2FA token for login (RAW):", email);
    console.log("🔍 Token provided:", cleanToken, "Length:", cleanToken.length);

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

    console.log("🔍 User found:", user.email);
    console.log("🔍 User 2FA enabled:", user.twoFactorEnabled);
    console.log("🔍 User has secret:", !!user.twoFactorSecret);
    console.log("🔍 User has backup codes:", Array.isArray(user.twoFactorBackupCodes) ? user.twoFactorBackupCodes.length : 0);

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is not enabled for this user" },
        { status: 400 }
      );
    }

    // Check if it's a backup code first (8 characters, alphanumeric)
    if (cleanToken.length === 8 && /^[A-Z0-9]+$/.test(cleanToken)) {
      console.log("🔍 Checking backup code:", cleanToken);
      
      if (user.twoFactorBackupCodes && Array.isArray(user.twoFactorBackupCodes)) {
        const backupCodeIndex = user.twoFactorBackupCodes.indexOf(cleanToken);
        
        if (backupCodeIndex !== -1) {
          // Valid backup code - remove it from the list (one-time use)
          const updatedBackupCodes = [...user.twoFactorBackupCodes];
          updatedBackupCodes.splice(backupCodeIndex, 1);
          
          await usersCollection.updateOne(
            { email: email.toLowerCase() },
            { $set: { twoFactorBackupCodes: updatedBackupCodes } }
          );
          
          console.log("✅ Backup code verified and removed for user:", email);
          return NextResponse.json({ 
            message: "Backup code verified successfully",
            type: "backup_code"
          });
        } else {
          console.log("❌ Invalid backup code for user:", email);
          return NextResponse.json(
            { error: "Invalid backup code" },
            { status: 400 }
          );
        }
      } else {
        console.log("❌ No backup codes available for user:", email);
        return NextResponse.json(
          { error: "No backup codes available" },
          { status: 400 }
        );
      }
    }
    
    // Check if it's a TOTP token (6 digits)
    else if (cleanToken.length === 6 && /^\d{6}$/.test(cleanToken)) {
      console.log("🔍 Checking TOTP token:", cleanToken);
      
      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: "2FA secret not found" },
          { status: 400 }
        );
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: cleanToken,
        window: 2
      });

      if (verified) {
        console.log("✅ TOTP token verified for user:", email);
        return NextResponse.json({ 
          message: "TOTP token verified successfully",
          type: "totp"
        });
      } else {
        console.log("❌ Invalid TOTP token for user:", email);
        return NextResponse.json(
          { error: "Invalid TOTP token" },
          { status: 400 }
        );
      }
    }
    
    // Invalid token format
    else {
      console.log("❌ Invalid token format:", cleanToken, "Length:", cleanToken.length);
      return NextResponse.json(
        { error: "Invalid token format. Use 6-digit TOTP or 8-character backup code." },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("❌ Error verifying 2FA token (RAW):", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA token" },
      { status: 500 }
    );
  }
}
