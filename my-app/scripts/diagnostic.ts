import { connectToDatabase } from "../lib/mongodb";
import mongoose from "mongoose";

async function diagnosticCheck() {
  try {
    console.log("🔍 Running diagnostic check...");
    console.log("MongoDB URI from env:", process.env.MONGODB_URI ? "Found" : "Not found");
    
    console.log("🔧 Attempting to connect...");
    await connectToDatabase();
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    console.log("✅ Connected successfully to database:", db.databaseName);
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log("\n📁 Available collections:");
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${count} documents`);
    }
    
    // Specifically check users collection
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`\n👥 Users collection: ${userCount} documents`);
    
    if (userCount > 0) {
      console.log("📋 Existing users:");
      const users = await usersCollection.find({}).toArray();
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.role}`);
      });
    } else {
      console.log("📋 No users found in collection");
    }
    
    console.log("\n✅ Diagnostic complete");
    
  } catch (error) {
    console.error("❌ Diagnostic error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Connection closed");
    process.exit(0);
  }
}

diagnosticCheck();
