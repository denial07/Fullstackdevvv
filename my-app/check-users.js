// Quick database check script
import { connectToDatabase } from "../lib/mongodb.js";
import User from "../lib/models/User.js";

async function checkUsers() {
  try {
    await connectToDatabase();
    
    console.log('🔍 Checking user records in database...');
    
    const users = await User.find({}).select('name email department role status').limit(5);
    
    console.log('📊 Found users:', users.length);
    
    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`, {
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        status: user.status
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers();
