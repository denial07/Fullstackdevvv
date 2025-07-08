// Test script for login alerts functionality
// Run with: cd my-app && npx tsx scripts/test-login-alerts.ts

import { connectToDatabase } from "../lib/mongodb";
import User, { IUser } from "../lib/models/User";

async function testUser(user: IUser) {
  console.log(`✅ Found test user: ${user.email}`);
  console.log(`🔔 Login alerts enabled: ${user.loginAlerts !== false ? 'YES' : 'NO'}`);
  console.log(`📱 Trusted devices: ${user.trustedDevices?.length || 0}`);
  
  if (user.trustedDevices && user.trustedDevices.length > 0) {
    console.log("📋 Trusted devices:");
    user.trustedDevices.forEach((device, index: number) => {
      console.log(`  ${index + 1}. Device ID: ${device.deviceId}`);
      console.log(`     IP: ${device.ipAddress}`);
      console.log(`     Last used: ${device.lastUsed}`);
      console.log(`     User Agent: ${device.userAgent?.substring(0, 50)}...`);
      console.log("");
    });
  }
  
  // Test setting login alerts to true
  console.log("� Enabling login alerts...");
  await User.findByIdAndUpdate(user._id, { loginAlerts: true });
  console.log("✅ Login alerts enabled");
  
  console.log("");
  console.log("🧪 Test completed!");
  console.log("📝 To test login alerts:");
  console.log("   1. Make sure the user has loginAlerts: true");
  console.log("   2. Login from a different browser/device");
  console.log("   3. Check the console logs for login alert messages");
  console.log("   4. The new device should be added to trustedDevices");
}

async function testLoginAlerts() {
  try {
    console.log("�🔧 Testing login alerts functionality...");
    
    console.log("📡 Connecting to database...");
    await connectToDatabase();
    console.log("✅ Database connected");
    
    // First, let's try to find any user
    console.log("🔍 Looking for users in database...");
    const allUsers = await User.find({}).select("email").limit(5);
    console.log(`📊 Found ${allUsers.length} users in database`);
    
    if (allUsers.length > 0) {
      console.log("📋 Available users:");
      allUsers.forEach(u => console.log(`   - ${u.email}`));
    }
    
    // Find a test user (you can modify this email)
    const testEmail = "admin@palletworks.sg"; // Change this to an existing user email
    console.log(`🔍 Looking for specific user: ${testEmail}`);
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log("❌ Test user not found. Trying different variations...");
      
      // Try case-insensitive search
      const userCaseInsensitive = await User.findOne({ 
        email: { $regex: new RegExp(`^${testEmail}$`, 'i') } 
      });
      
      if (userCaseInsensitive) {
        console.log(`✅ Found user with case difference: ${userCaseInsensitive.email}`);
        return testUser(userCaseInsensitive);
      }
      
      // Try partial match
      const userPartial = await User.findOne({ 
        email: { $regex: /admin/i } 
      });
      
      if (userPartial) {
        console.log(`✅ Found admin user: ${userPartial.email}`);
        return testUser(userPartial);
      }
      
      console.log("❌ No admin user found. Please check the database.");
      return;
    }
    
    return testUser(user);
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
}

testLoginAlerts();
