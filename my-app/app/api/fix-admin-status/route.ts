import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST() {
  try {
    console.log('🔧 Starting user status update - keeping admin active...');
    
    await connectToDatabase();
    
    // Reset admin to active if they were suspended
    await User.findOneAndUpdate(
      { email: 'admin@palletworks.sg' },
      { $set: { status: 'active' } }
    );
    console.log('✅ Set admin@palletworks.sg to active status');
    
    // Set all users to 'active' status by default first
    const result = await User.updateMany(
      {},
      { $set: { status: 'active' } }
    );
    console.log(`✅ Reset all ${result.modifiedCount} users to 'active' status`);
    
    // Find employees (not admins or managers) to suspend/inactivate
    const employees = await User.find({ 
      role: 'Employee',
      email: { $ne: 'admin@palletworks.sg' } // Exclude admin
    }).limit(3).lean();
    
    if (employees.length >= 1) {
      // Set first employee to suspended
      await User.findByIdAndUpdate(employees[0]._id, { status: 'suspended' });
      console.log(`✅ Set employee ${employees[0].email} to 'suspended'`);
    }
    
    if (employees.length >= 2) {
      // Set second employee to inactive
      await User.findByIdAndUpdate(employees[1]._id, { status: 'inactive' });
      console.log(`✅ Set employee ${employees[1].email} to 'inactive'`);
    }
    
    // Show final status distribution
    const finalUsers = await User.find({}, 'email role status').lean();
    console.log('📊 Final user statuses:');
    finalUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}): ${user.status}`);
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'User statuses updated - admin kept active, employees suspended',
      totalUsers: finalUsers.length,
      adminStatus: 'active'
    });
    
  } catch (error) {
    console.error('❌ Error updating user statuses:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
