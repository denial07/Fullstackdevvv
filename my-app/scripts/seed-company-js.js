require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Company data to seed
const companyData = {
  "_id": new mongoose.Types.ObjectId("6868f8545077753b05cd1168"),
  "companyName": "Singapore Pallet Works",
  "registrationNumber": "201234567K",
  "industry": "Wood Manufacturing & Logistics",
  "established": 2017,
  "address": "123 Industrial Park Road, Singapore 628123",
  "phone": "+65 6123 4567",
  "email": "info@palletworks.sg",
  "createdAt": new Date("2025-07-05T10:03:00.120Z"),
  "updatedAt": new Date("2025-07-24T03:59:03.137Z"),
  "__v": 0
};

async function seedCompany() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const companiesCollection = db.collection('companies');
    
    // Check current count
    const currentCount = await companiesCollection.countDocuments();
    console.log(`📊 Current companies in collection: ${currentCount}`);
    
    // Check if this specific company already exists
    const existingCompany = await companiesCollection.findOne({
      $or: [
        { _id: companyData._id },
        { registrationNumber: companyData.registrationNumber },
        { companyName: companyData.companyName }
      ]
    });
    
    if (existingCompany) {
      console.log('⚠️  Company already exists:');
      console.log(`   Name: ${existingCompany.companyName}`);
      console.log(`   Registration: ${existingCompany.registrationNumber}`);
      console.log(`   ID: ${existingCompany._id}`);
      console.log('   Skipping insertion to avoid duplicates.');
    } else {
      console.log('🔄 Inserting Singapore Pallet Works...');
      
      // Insert the company
      const result = await companiesCollection.insertOne(companyData);
      console.log(`✅ Successfully inserted company!`);
      console.log(`   ID: ${result.insertedId}`);
      console.log(`   Name: ${companyData.companyName}`);
      console.log(`   Registration: ${companyData.registrationNumber}`);
    }
    
    // Verify and show final state
    const finalCount = await companiesCollection.countDocuments();
    console.log(`📊 Final count: ${finalCount} companies`);
    
    // List all companies
    const allCompanies = await companiesCollection.find({}).toArray();
    console.log('\n🏢 Companies in database:');
    allCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.companyName}`);
      console.log(`   Registration: ${company.registrationNumber}`);
      console.log(`   Industry: ${company.industry}`);
      console.log(`   Established: ${company.established}`);
      console.log(`   Email: ${company.email}`);
      console.log(`   Phone: ${company.phone}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error seeding company:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

console.log('🚀 Starting company seeding...');
console.log('📍 Target: MongoDB test.companies collection');
console.log('🏢 Seeding: Singapore Pallet Works\n');

seedCompany();
