const { MongoClient } = require('mongodb');

// MongoDB connection string from environment or default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function checkUsers() {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Count total users
    const userCount = await usersCollection.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      // Get sample users (without passwords)
      const sampleUsers = await usersCollection
        .find({}, { 
          projection: { 
            password: 0, 
            twoFactorSecret: 0, 
            twoFactorBackupCodes: 0,
            resetPasswordToken: 0 
          } 
        })
        .limit(10)
        .toArray();
      
      console.log('\n👥 Sample users:');
      sampleUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Department: ${user.department || 'None'} - Status: ${user.status}`);
      });
      
      // Get departments
      const departments = await usersCollection.distinct('department');
      console.log('\n🏢 Departments:', departments.filter(d => d));
      
      // Get roles
      const roles = await usersCollection.distinct('role');
      console.log('👤 Roles:', roles.filter(r => r));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

checkUsers();
