import { connectToDatabase } from "../lib/mongodb";
import mongoose from "mongoose";

async function checkCompanies() {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    const count = await db!.collection('companies').countDocuments();
    console.log(`📊 Companies count: ${count}`);
    
    const companies = await db!.collection('companies').find({}).toArray();
    console.log('\n📋 Companies in database:');
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.companyName || company.name}`);
      console.log(`      Registration: ${company.registrationNumber}`);
      console.log(`      Industry: ${company.industry}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkCompanies();
