import { connectToDatabase } from "@/lib/mongodb";
import Company from "@/lib/models/Company";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Helper function to verify admin access
async function verifyAdminAccess() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { isAdmin: false, error: "No authentication token" };
    }

    // Decode the session token (base64 decoding as used in profile route)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired (24 hours)
    if (Date.now() - decoded.timestamp > 24 * 60 * 60 * 1000) {
      return { isAdmin: false, error: "Token expired" };
    }

    // Connect to database to verify user
    await connectToDatabase();
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return { isAdmin: false, error: "User not found" };
    }

    // Check if user is admin@palletworks.sg OR has Administrator role
    const isAdmin = user.email === "admin@palletworks.sg" || user.role === "Administrator";
    
    return { isAdmin, user, error: null };
  } catch (error) {
    console.error("❌ Admin verification error:", error);
    return { isAdmin: false, error: "Invalid authentication" };
  }
}

// GET /api/companies - Get all companies (Admin only)
export async function GET() {
  try {
    console.log("🔍 Admin fetching all companies...");

    // Verify admin access
    const { isAdmin, error: authError } = await verifyAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: authError || "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get all companies
    const companies = await Company.find({}).sort({ createdAt: -1 });

    console.log(`✅ Found ${companies.length} companies`);

    return NextResponse.json({
      companies: companies.map(company => ({
        id: company._id,
        companyName: company.companyName,
        registrationNumber: company.registrationNumber,
        industry: company.industry,
        established: company.established,
        address: company.address,
        phone: company.phone,
        email: company.email,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      })),
      count: companies.length
    });

  } catch (error) {
    console.error("❌ Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
