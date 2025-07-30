import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;

// Sample user data (simplified)
const testUser = {
  "email": "admin@palletworks.sg",
  "password": "$2b$12$JNtT0iyCxj7a4sfKBPSPhO7YipUTqlUsvpmFp5H3Q3GqZJAvyAb2m",
  "name": "Admin User",
  "role": "Administrator",
  "company": "Singapore Pallet Works",
  "phone": "+65 9393 8393",
  "department": "Management",
  "bio": "Administrator user",
  "twoFactorEnabled": true,
  "loginAlerts": true,
  "sessionTimeout": 30,
  "createdAt": new Date(),
  "updatedAt": new Date()
};

async function quickUserSeed() {
  let connection;
  
  try {
    console.log("🔧 Connecting to MongoDB...");
    
    // Set connection timeout
    connection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
    });
    
    console.log("✅ Connected!");
    
    const db = mongoose.connection.db!;
    console.log("📁 Database:", db.databaseName);
    
    const usersCollection = db.collection('users');
    
    // Check current count
    const currentCount = await usersCollection.countDocuments();
    console.log(`📊 Current users: ${currentCount}`);
    
    // Check if admin user exists
    const existingAdmin = await usersCollection.findOne({ email: "admin@palletworks.sg" });
    
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
    } else {
      console.log("🔄 Inserting admin user...");
      await usersCollection.insertOne(testUser);
      console.log("✅ Admin user inserted!");
    }
    
    // Final count
    const finalCount = await usersCollection.countDocuments();
    console.log(`📊 Final users: ${finalCount}`);
    
    // List all users
    const allUsers = await usersCollection.find({}).toArray();
    console.log("\n👥 All users:");
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role || 'No role'})`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log("🔌 Disconnected");
    }
    process.exit(0);
  }
}

console.log("🚀 Quick user seeding test...");
quickUserSeed();
