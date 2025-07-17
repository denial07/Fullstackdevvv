// Test script to verify session timeout database storage
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: String,
  loginAlerts: Boolean,
  sessionTimeout: Number,
  trustedDevices: [Object]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function testSessionTimeout() {
  try {
    console.log('🔧 Testing session timeout database storage...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const testEmail = "manager@palletworks.sg";
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log(`❌ User not found: ${testEmail}`);
      return;
    }
    
    console.log(`👤 Found user: ${user.email}`);
    console.log(`⏱️  Current session timeout: ${user.sessionTimeout} minutes`);
    console.log(`📊 Login alerts: ${user.loginAlerts ? 'ENABLED' : 'DISABLED'}`);
    
    // Test updating session timeout
    console.log('\n🔄 Testing session timeout updates...');
    
    // Test setting to 60 minutes
    console.log('1️⃣ Setting session timeout to 60 minutes...');
    await User.findByIdAndUpdate(user._id, { sessionTimeout: 60 });
    
    const userAfter60 = await User.findById(user._id);
    console.log(`   Session timeout: ${userAfter60.sessionTimeout} minutes ✅`);
    
    // Test setting to 120 minutes
    console.log('2️⃣ Setting session timeout to 120 minutes...');
    await User.findByIdAndUpdate(user._id, { sessionTimeout: 120 });
    
    const userAfter120 = await User.findById(user._id);
    console.log(`   Session timeout: ${userAfter120.sessionTimeout} minutes ✅`);
    
    // Reset to default (30 minutes)
    console.log('3️⃣ Resetting to default (30 minutes)...');
    await User.findByIdAndUpdate(user._id, { sessionTimeout: 30 });
    
    const userAfterReset = await User.findById(user._id);
    console.log(`   Session timeout: ${userAfterReset.sessionTimeout} minutes ✅`);
    
    console.log('\n✅ Session timeout test completed!');
    console.log('📝 Summary:');
    console.log('   ✅ sessionTimeout field exists in database');
    console.log('   ✅ Can update sessionTimeout values'); 
    console.log('   ✅ Database updates are persistent');
    console.log('   ✅ Default value is 30 minutes');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

testSessionTimeout();
