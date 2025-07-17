import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectToDatabase();
    
    const email = "admin@palletworks.sg";
    
    // Get user with Mongoose
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("🔍 Mongoose user:", user ? "found" : "not found");
    if (user) {
      console.log("🔍 Mongoose user fields:", Object.keys(user.toObject()));
      console.log("🔍 Mongoose twoFactorEnabled:", user.twoFactorEnabled);
      console.log("🔍 Mongoose twoFactorSecret:", !!user.twoFactorSecret);
      console.log("🔍 Mongoose twoFactorBackupCodes:", user.twoFactorBackupCodes);
    }
    
    // Get user with raw MongoDB
    const db = mongoose.connection.db;
    let rawUser = null;
    if (db) {
      const usersCollection = db.collection('users');
      rawUser = await usersCollection.findOne({ email: email.toLowerCase() });
      console.log("🔍 Raw user:", rawUser ? "found" : "not found");
      if (rawUser) {
        console.log("🔍 Raw user fields:", Object.keys(rawUser));
        console.log("🔍 Raw twoFactorEnabled:", rawUser.twoFactorEnabled);
        console.log("🔍 Raw twoFactorSecret:", !!rawUser.twoFactorSecret);
        console.log("🔍 Raw twoFactorBackupCodes:", rawUser.twoFactorBackupCodes);
      }
    }
    
    // Get the User schema paths
    const schema = User.schema;
    const paths = schema.paths;
    console.log("🔍 Schema has twoFactorEnabled:", !!paths.twoFactorEnabled);
    console.log("🔍 Schema has twoFactorSecret:", !!paths.twoFactorSecret);
    console.log("🔍 Schema has twoFactorBackupCodes:", !!paths.twoFactorBackupCodes);
    
    return NextResponse.json({
      mongooseUser: user ? {
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorSecret: !!user.twoFactorSecret,
        twoFactorBackupCodes: user.twoFactorBackupCodes?.length || 0
      } : null,
      rawUser: rawUser ? {
        email: rawUser.email,
        twoFactorEnabled: rawUser.twoFactorEnabled,
        twoFactorSecret: !!rawUser.twoFactorSecret,
        twoFactorBackupCodes: rawUser.twoFactorBackupCodes?.length || 0
      } : null,
      schema: {
        hasTwoFactorEnabled: !!paths.twoFactorEnabled,
        hasTwoFactorSecret: !!paths.twoFactorSecret,
        hasTwoFactorBackupCodes: !!paths.twoFactorBackupCodes
      }
    });
    
  } catch (error) {
    console.error("❌ Test API error:", error);
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}
