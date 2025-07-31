import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';

console.log('🔍 Verifying all seeded data in test database...');

async function verifyAllData() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all collections
        const db = mongoose.connection.db;
        
        // Check users
        const users = await db.collection('users').find({}).toArray();
        console.log(`\n👥 Users collection: ${users.length} users`);
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
        });

        // Check companies
        const companies = await db.collection('companies').find({}).toArray();
        console.log(`\n🏢 Companies collection: ${companies.length} companies`);
        companies.forEach((company, index) => {
            console.log(`${index + 1}. ${company.name} (${company.email})`);
        });

        // Check contact requests
        const contactRequests = await db.collection('contactrequests').find({}).toArray();
        console.log(`\n📬 Contact requests collection: ${contactRequests.length} requests`);
        contactRequests.forEach((request, index) => {
            console.log(`${index + 1}. ${request.name} (${request.email}) - Status: ${request.status}`);
        });

        console.log('\n✅ Data verification completed!');
        
    } catch (error) {
        console.error('❌ Error verifying data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

verifyAllData();
