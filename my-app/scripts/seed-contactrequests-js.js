import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';

// Contact requests data to seed
const contactRequestsData = [
  {
    "_id": new mongoose.Types.ObjectId("6881b42bee9724f7c5599c7b"),
    "name": "Manager",
    "email": "manager@palletworks.sg",
    "message": "My account is logged",
    "status": "responded",
    "createdAt": new Date("2025-07-24T04:18:51.940Z"),
    "updatedAt": new Date("2025-07-24T07:27:55.887Z"),
    "__v": 0
  },
  {
    "_id": new mongoose.Types.ObjectId("6881b494ee9724f7c5599c7e"),
    "name": "Employee1",
    "email": "employee1@palletworks.sg",
    "message": "I am a new employee at NGS and would like to request for the creation of my account",
    "status": "reviewed",
    "createdAt": new Date("2025-07-24T04:20:36.824Z"),
    "updatedAt": new Date("2025-07-24T07:27:44.906Z"),
    "__v": 0
  }
];

async function seedContactRequests() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const contactRequestsCollection = db.collection('contactrequests');
    
    // Check current count
    const currentCount = await contactRequestsCollection.countDocuments();
    console.log(`📊 Current contact requests in collection: ${currentCount}`);
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const requestData of contactRequestsData) {
      // Check if this specific contact request already exists
      const existingRequest = await contactRequestsCollection.findOne({
        $or: [
          { _id: requestData._id },
          { 
            email: requestData.email,
            createdAt: requestData.createdAt 
          }
        ]
      });
      
      if (existingRequest) {
        console.log(`⏭️  Skipping contact request from ${requestData.name} (${requestData.email}) - already exists`);
        skippedCount++;
      } else {
        // Insert the contact request
        await contactRequestsCollection.insertOne(requestData);
        console.log(`✅ Inserted contact request from ${requestData.name} (${requestData.email}) - Status: ${requestData.status}`);
        insertedCount++;
      }
    }
    
    console.log(`\n📈 Seeding completed: ${insertedCount} inserted, ${skippedCount} skipped`);
    
    // Verify and show final state
    const finalCount = await contactRequestsCollection.countDocuments();
    console.log(`📊 Final count: ${finalCount} contact requests`);
    
    // List all contact requests
    const allRequests = await contactRequestsCollection.find({}).sort({ createdAt: 1 }).toArray();
    console.log('\n📬 Contact requests in database:');
    allRequests.forEach((request, index) => {
      console.log(`${index + 1}. ${request.name} (${request.email})`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Message: ${request.message.substring(0, 50)}${request.message.length > 50 ? '...' : ''}`);
      console.log(`   Created: ${request.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Updated: ${request.updatedAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error seeding contact requests:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

console.log('🚀 Starting contact requests seeding...');
console.log('📍 Target: MongoDB test.contactrequests collection');
console.log('📬 Seeding 2 contact requests\n');

seedContactRequests();
