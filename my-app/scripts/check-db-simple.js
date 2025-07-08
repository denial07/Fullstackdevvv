const { MongoClient } = require('mongodb');

async function checkDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('fullstackdevvv');
    const collection = db.collection('users');
    
    const users = await collection.find({}).toArray();
    console.log(`📋 Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.email}`);
      console.log(`   _id: ${user._id}`);
      console.log(`   loginAlerts: ${user.loginAlerts} (type: ${typeof user.loginAlerts})`);
      console.log(`   loginAlerts exists: ${'loginAlerts' in user}`);
      console.log(`   All fields:`, Object.keys(user));
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabase();
