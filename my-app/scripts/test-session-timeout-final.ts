import { connectToDatabase } from '../lib/mongodb';
import User from '../lib/models/User';

async function testSessionTimeout() {
  try {
    await connectToDatabase();
    console.log('🔌 Connected to database');
    
    // Find a test user (you can replace this with a specific email)
    const user = await User.findOne().select('email name sessionTimeout');
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log('👤 Found user:', user.email);
    console.log('⏱️ Current session timeout:', user.sessionTimeout, 'minutes');
    
    // Test updating session timeout to 60 minutes
    const testTimeout = 60;
    console.log(`📝 Updating session timeout to ${testTimeout} minutes...`);
    
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { sessionTimeout: testTimeout },
      { new: true, runValidators: true }
    ).select('email name sessionTimeout');
    
    if (updatedUser) {
      console.log('✅ Session timeout updated successfully!');
      console.log('⏱️ New session timeout:', updatedUser.sessionTimeout, 'minutes');
    } else {
      console.log('❌ Failed to update session timeout');
    }
    
    // Test updating to another value
    const testTimeout2 = 45;
    console.log(`📝 Updating session timeout to ${testTimeout2} minutes...`);
    
    const updatedUser2 = await User.findByIdAndUpdate(
      user._id,
      { sessionTimeout: testTimeout2 },
      { new: true, runValidators: true }
    ).select('email name sessionTimeout');
    
    if (updatedUser2) {
      console.log('✅ Session timeout updated successfully again!');
      console.log('⏱️ Final session timeout:', updatedUser2.sessionTimeout, 'minutes');
    } else {
      console.log('❌ Failed to update session timeout on second attempt');
    }
    
    // Test validation (should fail for values outside the 5-1440 range)
    console.log('🧪 Testing validation with invalid values...');
    
    try {
      await User.findByIdAndUpdate(
        user._id,
        { sessionTimeout: 3 }, // Too low
        { new: true, runValidators: true }
      );
      console.log('❌ Validation failed - should not allow values below 5');
    } catch (error) {
      console.log('✅ Validation working - correctly rejected value below 5 minutes');
    }
    
    try {
      await User.findByIdAndUpdate(
        user._id,
        { sessionTimeout: 1500 }, // Too high  
        { new: true, runValidators: true }
      );
      console.log('❌ Validation failed - should not allow values above 1440');
    } catch (error) {
      console.log('✅ Validation working - correctly rejected value above 1440 minutes');
    }
    
  } catch (error) {
    console.error('❌ Error testing session timeout:', error);
  } finally {
    process.exit(0);
  }
}

testSessionTimeout();
