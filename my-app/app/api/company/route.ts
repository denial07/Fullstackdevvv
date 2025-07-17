import { connectToDatabase } from "@/lib/mongodb";
import Company from "@/lib/models/Company";
import { NextResponse } from "next/server";

// GET /api/company - Get company information
export async function GET() {
  try {
    console.log("🔍 Fetching company data...");
    
    // Connect to database
    await connectToDatabase();
    
    // Get company data
    const company = await Company.findOne();

    if (!company) {
      return NextResponse.json(
        { error: "Company data not found" },
        { status: 404 }
      );
    }

    console.log("✅ Company data found:", company.companyName);

    return NextResponse.json({
      company: {
        id: company._id,
        companyName: company.companyName,
        registrationNumber: company.registrationNumber,
        industry: company.industry,
        established: company.established,
        address: company.address,
        phone: company.phone,
        email: company.email
      }
    });

  } catch (error) {
    console.error("❌ Error fetching company data:", error);
    return NextResponse.json(
      { error: "Failed to fetch company data" },
      { status: 500 }
    );
  }
}
