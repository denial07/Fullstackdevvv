// Test script to simulate the security API call
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  loginAlerts: { type: Boolean, default: true },
  trustedDevices: [Object]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function testSecurityUpdate() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find a test user
    const testEmail = "manager@palletworks.sg";
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`\n👤 Testing with user: ${user.email}`);
    console.log(`📊 Current loginAlerts status: ${user.loginAlerts} (${typeof user.loginAlerts})`);
    
    // Test 1: Disable login alerts (set to false)
    console.log('\n🔄 Test 1: Disabling login alerts...');
    const result1 = await User.findByIdAndUpdate(
      user._id,
      { loginAlerts: false },
      { new: true, runValidators: true }
    );
    console.log(`   Result: ${result1.loginAlerts} (${typeof result1.loginAlerts})`);
    
    // Verify the update by fetching fresh from DB
    const verify1 = await User.findById(user._id);
    console.log(`   Verified from DB: ${verify1.loginAlerts} (${typeof verify1.loginAlerts})`);
    
    // Test 2: Enable login alerts (set to true)
    console.log('\n🔄 Test 2: Enabling login alerts...');
    const result2 = await User.findByIdAndUpdate(
      user._id,
      { loginAlerts: true },
      { new: true, runValidators: true }
    );
    console.log(`   Result: ${result2.loginAlerts} (${typeof result2.loginAlerts})`);
    
    // Verify the update by fetching fresh from DB
    const verify2 = await User.findById(user._id);
    console.log(`   Verified from DB: ${verify2.loginAlerts} (${typeof verify2.loginAlerts})`);
    
    // Test 3: Try with explicit boolean conversion
    console.log('\n🔄 Test 3: Testing with Boolean() conversion...');
    const result3 = await User.findByIdAndUpdate(
      user._id,
      { loginAlerts: Boolean(false) },
      { new: true, runValidators: true }
    );
    console.log(`   Result: ${result3.loginAlerts} (${typeof result3.loginAlerts})`);
    
    // Final verification
    const finalUser = await User.findById(user._id);
    console.log(`\n✅ Final state: ${finalUser.loginAlerts} (${typeof finalUser.loginAlerts})`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

testSecurityUpdate();
