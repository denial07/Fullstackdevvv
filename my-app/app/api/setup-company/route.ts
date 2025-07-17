import { connectToDatabase } from "@/lib/mongodb";
import Company from "@/lib/models/Company";
import { NextResponse } from "next/server";

// GET /api/setup-company - Create company data (development only) - Browser accessible
export async function GET() {
  return POST(); // Reuse the same logic as POST
}

// POST /api/setup-company - Create company data (development only)
export async function POST() {
  try {
    // Only allow this in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    console.log("🏢 Creating company data...");
    
    // Connect to database
    await connectToDatabase();
    
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

    return NextResponse.json({
      message: "Company data created successfully",
      company: {
        id: createdCompany._id,
        companyName: createdCompany.companyName,
        registrationNumber: createdCompany.registrationNumber,
        industry: createdCompany.industry,
        established: createdCompany.established,
        address: createdCompany.address,
        phone: createdCompany.phone,
        email: createdCompany.email
      }
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error creating company data:", error);
    return NextResponse.json(
      { 
        error: "Failed to create company data", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
