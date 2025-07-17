require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Simple user schema
const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  loginAlerts: { type: Boolean, default: true },
  trustedDevices: [Object]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function testDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.email}`);
      console.log(`   loginAlerts: ${user.loginAlerts} (${typeof user.loginAlerts})`);
      console.log(`   loginAlerts exists in doc: ${'loginAlerts' in user._doc}`);
      console.log(`   trustedDevices: ${user.trustedDevices ? user.trustedDevices.length : 0} devices`);
    });
    
    // Try to update a user's loginAlerts
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n🔄 Testing update on ${testUser.email}...`);
      
      // Update to false
      await User.findByIdAndUpdate(testUser._id, { loginAlerts: false });
      const updatedUser1 = await User.findById(testUser._id);
      console.log(`   After setting to false: ${updatedUser1.loginAlerts}`);
      
      // Update to true
      await User.findByIdAndUpdate(testUser._id, { loginAlerts: true });
      const updatedUser2 = await User.findById(testUser._id);
      console.log(`   After setting to true: ${updatedUser2.loginAlerts}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

testDatabase();
