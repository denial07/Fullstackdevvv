// List all users in the database
// Run with: cd my-app && npx tsx scripts/list-users.ts

import { connectToDatabase } from "../lib/mongodb";
import User from "../lib/models/User";

async function listUsers() {
  try {
    console.log("🔍 Listing all users in the database...");
    
    await connectToDatabase();
    
    const users = await User.find({}).select("email name role twoFactorEnabled loginAlerts");
    
    if (users.length === 0) {
      console.log("❌ No users found in the database.");
      return;
    }
    
    console.log(`✅ Found ${users.length} users:`);
    console.log("");
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   2FA Enabled: ${user.twoFactorEnabled ? 'YES' : 'NO'}`);
      console.log(`   Login Alerts: ${user.loginAlerts !== false ? 'YES' : 'NO'}`);
      console.log("");
    });
    
  } catch (error) {
    console.error("❌ Failed to list users:", error);
  } finally {
    process.exit(0);
  }
}

listUsers();
