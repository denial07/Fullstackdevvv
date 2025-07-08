import { connectToDatabase } from "../lib/mongodb";
import mongoose from "mongoose";

async function addTwoFactorFields() {
  try {
    console.log("🔧 Connecting to database...");
    await connectToDatabase();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    const usersCollection = db.collection('users');
    
    console.log("🔍 Adding 2FA fields to existing user documents...");
    
    // Update all users to have the 2FA fields
    const result = await usersCollection.updateMany(
      {}, // Update all documents
      {
        $set: {
          twoFactorEnabled: false,
          twoFactorBackupCodes: []
        },
        $unset: {
          twoFactorSecret: "" // Remove any existing secret
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} user documents`);

    // Verify the update
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`📋 User: ${user.email}`);
      console.log(`   - twoFactorEnabled: ${user.twoFactorEnabled}`);
      console.log(`   - twoFactorSecret: ${user.twoFactorSecret || 'not set'}`);
      console.log(`   - twoFactorBackupCodes: ${Array.isArray(user.twoFactorBackupCodes) ? user.twoFactorBackupCodes.length + ' codes' : 'not set'}`);
      console.log(`   - All fields: ${Object.keys(user).join(', ')}`);
    }

  } catch (error) {
    console.error("❌ Error adding 2FA fields:", error);
  } finally {
    process.exit(0);
  }
}

// Run the script
addTwoFactorFields();
