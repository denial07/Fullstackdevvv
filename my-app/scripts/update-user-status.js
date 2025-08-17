const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function updateUserStatuses() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Updating user statuses...');
    
    // Set all users to 'active' status by default
    const result = await User.updateMany(
      { status: { $exists: false } }, // Users without status field
      { $set: { status: 'active' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users to have 'active' status`);
    
    // Set a couple users to different statuses for testing
    const users = await User.find({}).limit(3);
    if (users.length >= 3) {
      // Set second user to suspended
      await User.findByIdAndUpdate(users[1]._id, { status: 'suspended' });
      console.log(`✅ Set user ${users[1].email} to 'suspended' status`);
      
      // Set third user to inactive
      await User.findByIdAndUpdate(users[2]._id, { status: 'inactive' });
      console.log(`✅ Set user ${users[2].email} to 'inactive' status`);
    }
    
    // Show final status distribution
    const statusCounts = await User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('📊 Status distribution:');
    statusCounts.forEach(item => {
      console.log(`  - ${item._id}: ${item.count} users`);
    });
    
    console.log('✅ Status update completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user statuses:', error);
    process.exit(1);
  }
}

updateUserStatuses();
