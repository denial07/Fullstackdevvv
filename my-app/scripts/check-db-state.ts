import { connectToDatabase } from '../lib/mongodb';
import User from '../lib/models/User';

async function checkDatabaseState() {
  try {
    console.log('📊 Checking database state...');
    
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Get all users to see their current state
    const users = await User.find({}).select('email name loginAlerts trustedDevices');
    
    console.log(`📋 Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   loginAlerts: ${user.loginAlerts} (type: ${typeof user.loginAlerts})`);
      console.log(`   trustedDevices: ${user.trustedDevices ? user.trustedDevices.length : 0} devices`);
      
      if (user.trustedDevices && user.trustedDevices.length > 0) {
        user.trustedDevices.forEach((device, deviceIndex) => {
          console.log(`     Device ${deviceIndex + 1}: ${device.deviceId} (IP: ${device.ipAddress})`);
        });
      }
    });

    // Also check the raw document to see all fields
    const rawUsers = await User.collection.find({}).toArray();
    console.log('\n🔍 Raw document structure:');
    rawUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1} raw document keys:`, Object.keys(user));
      console.log(`loginAlerts field exists: ${'loginAlerts' in user}`);
      console.log(`loginAlerts value: ${user.loginAlerts} (type: ${typeof user.loginAlerts})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabaseState();
