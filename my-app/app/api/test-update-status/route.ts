import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST() {
  try {
    console.log('🔧 Starting user status update...');
    
    await connectToDatabase();
    
    // First, let's see current users and their status
    const allUsers = await User.find({}, 'email status').lean();
    console.log('📋 Current users:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email}: status = ${user.status || 'undefined'}`);
    });
    
    // Update users without status to 'active'
    const updateResult = await User.updateMany(
      { $or: [{ status: { $exists: false } }, { status: null }] },
      { $set: { status: 'active' } }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} users to 'active' status`);
    
    // Set some users to different statuses for testing
    const users = await User.find({}).lean();
    
    // Find a random employee (not admin) to suspend
    const employees = users.filter(user => 
      user.role === 'Employee' && 
      user.email !== 'admin@palletworks.sg'
    );
    
    if (employees.length >= 1) {
      // Set first employee to suspended
      await User.findByIdAndUpdate(employees[0]._id, { status: 'suspended' });
      console.log(`✅ Set user ${employees[0].email} to 'suspended'`);
    }
    
    if (employees.length >= 2) {
      // Set second employee to inactive
      await User.findByIdAndUpdate(employees[1]._id, { status: 'inactive' });
      console.log(`✅ Set user ${employees[1].email} to 'inactive'`);
    }
    
    // Show final status distribution
    const finalUsers = await User.find({}, 'email status').lean();
    console.log('📊 Final user statuses:');
    finalUsers.forEach(user => {
      console.log(`  - ${user.email}: ${user.status}`);
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'User statuses updated successfully',
      usersUpdated: updateResult.modifiedCount,
      totalUsers: finalUsers.length
    });
    
  } catch (error) {
    console.error('❌ Error updating user statuses:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
