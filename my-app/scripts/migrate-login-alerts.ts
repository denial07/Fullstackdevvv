// Migration script to add loginAlerts field to existing users
// Run with: npx tsx scripts/migrate-login-alerts.ts

import { connectToDatabase } from "../lib/mongodb";
import User from "../lib/models/User";

async function migrateLoginAlerts() {
  try {
    console.log("🔧 Starting migration to add loginAlerts field...");
    
    await connectToDatabase();
    console.log("✅ Database connected");
    
    // Find all users that don't have the loginAlerts field
    const usersWithoutLoginAlerts = await User.find({ 
      loginAlerts: { $exists: false } 
    });
    
    console.log(`📊 Found ${usersWithoutLoginAlerts.length} users without loginAlerts field`);
    
    if (usersWithoutLoginAlerts.length === 0) {
      console.log("✅ All users already have the loginAlerts field");
      
      // Show current state of all users
      const allUsers = await User.find({}).select('email loginAlerts');
      console.log("\n📋 Current state of all users:");
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}: loginAlerts = ${user.loginAlerts} (${typeof user.loginAlerts})`);
      });
      
      return;
    }
    
    // Update users to add the loginAlerts field with default value true
    const result = await User.updateMany(
      { loginAlerts: { $exists: false } },
      { $set: { loginAlerts: true } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users with loginAlerts: true`);
    
    // Also ensure trustedDevices field exists
    const usersWithoutTrustedDevices = await User.find({ 
      trustedDevices: { $exists: false } 
    });
    
    if (usersWithoutTrustedDevices.length > 0) {
      const trustedDevicesResult = await User.updateMany(
        { trustedDevices: { $exists: false } },
        { $set: { trustedDevices: [] } }
      );
      
      console.log(`✅ Updated ${trustedDevicesResult.modifiedCount} users with empty trustedDevices array`);
    }
    
    // Verify the migration
    console.log("\n🔍 Verifying migration...");
    const allUsers = await User.find({}).select('email loginAlerts trustedDevices');
    
    console.log(`📊 Total users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}:`);
      console.log(`   loginAlerts: ${user.loginAlerts} (${typeof user.loginAlerts})`);
      console.log(`   trustedDevices: ${user.trustedDevices?.length || 0} devices`);
    });
    
    console.log("\n✅ Migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    process.exit(0);
  }
}

migrateLoginAlerts();
