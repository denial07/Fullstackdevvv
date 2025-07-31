import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';

// Users data to seed
const usersData = [
  {
    "_id": new mongoose.Types.ObjectId("6868af321812b08e57deb093"),
    "email": "admin@palletworks.sg",
    "password": "$2b$12$JNtT0iyCxj7a4sfKBPSPhO7YipUTqlUsvpmFp5H3Q3GqZJAvyAb2m",
    "name": "Admin User",
    "role": "Administrator",
    "company": "Singapore Pallet Works",
    "phone": "+65 9393 8393",
    "department": "Management",
    "bio": "eg. Been an administrator for 5 year, in charged of ...",
    "__v": 0,
    "createdAt": new Date("2025-07-05T04:50:58.712Z"),
    "updatedAt": new Date("2025-07-30T06:25:44.365Z"),
    "twoFactorBackupCodes": [],
    "twoFactorEnabled": true,
    "twoFactorSecret": "GFBG4L2HJZHFI5BWLB5F2MKSGFRWWVLOPV6TIJLTHZKDM5CWMRPA",
    "trustedDevices": [],
    "loginAlerts": true,
    "sessionTimeout": 30
  },
  {
    "_id": new mongoose.Types.ObjectId("6868af321812b08e57deb094"),
    "email": "manager@palletworks.sg",
    "password": "$2b$12$Fl4btBygdT1CZUGwlr1eTeMalLE9CzJEZFybdU6VlpHHDiWDgZG6u",
    "name": "Manager User",
    "role": "Manager",
    "company": "Singapore Pallet Works",
    "phone": "+65 9234 5678",
    "department": "Operations",
    "bio": "Operations manager responsible for daily warehouse operations and inventory management",
    "__v": 0,
    "createdAt": new Date("2025-07-05T04:50:58.713Z"),
    "updatedAt": new Date("2025-07-24T04:28:00.565Z"),
    "twoFactorBackupCodes": [],
    "twoFactorEnabled": true,
    "twoFactorSecret": "JQ4D6WTSKRLDE5TYO5XEGMTPENVSIVTHEFFUAQKVKRTG22ZRNA4Q",
    "trustedDevices": [],
    "loginAlerts": true,
    "sessionTimeout": 5
  },
  {
    "_id": new mongoose.Types.ObjectId("6868af321812b08e57deb095"),
    "email": "employee@palletworks.sg",
    "password": "$2b$12$ijQGHXz7bXunZj/BP5WVZeZ.8neY6eV3gfye4Wk3p3I8yiBtS0giq",
    "name": "Employee User",
    "role": "Employee",
    "company": "Singapore Pallet Works",
    "phone": "+65 9345 6789",
    "department": "Logistics",
    "bio": "Logistics coordinator handling shipment tracking and communications with clients",
    "__v": 0,
    "createdAt": new Date("2025-07-05T04:50:58.713Z"),
    "updatedAt": new Date("2025-07-24T05:43:37.102Z"),
    "twoFactorBackupCodes": [],
    "twoFactorEnabled": false,
    "trustedDevices": [],
    "loginAlerts": true,
    "sessionTimeout": 30
  }
];

async function seedUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Check current count
    const currentCount = await usersCollection.countDocuments();
    console.log(`📊 Current users in collection: ${currentCount}`);
    
    if (currentCount === 0) {
      console.log('🔄 Collection is empty, inserting all users...');
      
      // Insert all users
      const result = await usersCollection.insertMany(usersData);
      console.log(`✅ Successfully inserted ${result.insertedCount} users!`);
      
      // Verify insertion
      const finalCount = await usersCollection.countDocuments();
      console.log(`📊 Final count: ${finalCount} users`);
      
      // List all users
      const allUsers = await usersCollection.find({}).toArray();
      console.log('\n👥 Users in database:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
        console.log(`   Department: ${user.department}`);
        console.log(`   2FA: ${user.twoFactorEnabled ? 'Enabled' : 'Disabled'}`);
        console.log(`   Session Timeout: ${user.sessionTimeout} min`);
        console.log('');
      });
      
    } else {
      console.log('⚠️  Users already exist in collection:');
      const existingUsers = await usersCollection.find({}).toArray();
      existingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ${user.role || 'No role'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

console.log('🚀 Starting user seeding...');
console.log('📍 Target: MongoDB test.users collection');
console.log('👥 Seeding 3 users: Admin, Manager, Employee\n');

seedUsers();
