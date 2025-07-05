require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Define the schema directly in this file
const CompanySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  established: {
    type: Number,
    required: [true, 'Establishment year is required'],
    min: [1800, 'Establishment year must be after 1800'],
    max: [new Date().getFullYear(), 'Establishment year cannot be in the future']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(phone) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  }
}, {
  timestamps: true
});

async function seedCompany() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error("❌ MONGODB_URI is not defined in the environment.");
      process.exit(1);
    }

    console.log("🏢 Connecting to database...");
    await mongoose.connect(uri);
    
    const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);
    
    // Clear existing company data
    await Company.deleteMany({});
    console.log("🗑️  Cleared existing company data");

    // Company data
    const companyData = {
      companyName: "Singapore Pallet Works",
      registrationNumber: "201234567K",
      industry: "Wood Manufacturing & Logistics",
      established: 2018,
      address: "123 Industrial Park Road, Singapore 628123",
      phone: "+65 6123 4567",
      email: "info@palletworks.sg"
    };

    // Insert company data
    const createdCompany = await Company.create(companyData);
    console.log(`✅ Created company: ${createdCompany.companyName}`);
    console.log("Company data:", {
      id: createdCompany._id,
      companyName: createdCompany.companyName,
      registrationNumber: createdCompany.registrationNumber,
      industry: createdCompany.industry,
      established: createdCompany.established,
      address: createdCompany.address,
      phone: createdCompany.phone,
      email: createdCompany.email
    });

    console.log("🎉 Company seeding completed successfully!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding company:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedCompany();
