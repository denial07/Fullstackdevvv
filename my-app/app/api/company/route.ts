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

// POST /api/company - Create new company (Admin only)
export async function POST(request: Request) {
  try {
    console.log("🏢 Creating new company...");

    // Verify admin access
    const { isAdmin, error: authError } = await verifyAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: authError || "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { companyName, registrationNumber, industry, established, address, phone, email } = body;

    // Validate required fields
    if (!companyName || !registrationNumber || !industry || !established || !address || !phone || !email) {
      return NextResponse.json(
        { error: "All company fields are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Create new company
    const newCompany = new Company({
      companyName,
      registrationNumber,
      industry,
      established,
      address,
      phone,
      email
    });

    const savedCompany = await newCompany.save();
    console.log("✅ Company created:", savedCompany.companyName);

    return NextResponse.json({
      message: "Company created successfully",
      company: {
        id: savedCompany._id,
        companyName: savedCompany.companyName,
        registrationNumber: savedCompany.registrationNumber,
        industry: savedCompany.industry,
        established: savedCompany.established,
        address: savedCompany.address,
        phone: savedCompany.phone,
        email: savedCompany.email
      }
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error creating company:", error);
    
    // Handle mongoose validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: "Company with this registration number or email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}

// PUT /api/company - Update company (Admin only)
export async function PUT(request: Request) {
  try {
    console.log("📝 Updating company...");

    // Verify admin access
    const { isAdmin, error: authError } = await verifyAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: authError || "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, companyName, registrationNumber, industry, established, address, phone, email } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Company ID is required for update" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Update company
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      {
        companyName,
        registrationNumber,
        industry,
        established,
        address,
        phone,
        email
      },
      { new: true, runValidators: true }
    );

    if (!updatedCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    console.log("✅ Company updated:", updatedCompany.companyName);

    return NextResponse.json({
      message: "Company updated successfully",
      company: {
        id: updatedCompany._id,
        companyName: updatedCompany.companyName,
        registrationNumber: updatedCompany.registrationNumber,
        industry: updatedCompany.industry,
        established: updatedCompany.established,
        address: updatedCompany.address,
        phone: updatedCompany.phone,
        email: updatedCompany.email
      }
    });

  } catch (error) {
    console.error("❌ Error updating company:", error);
    
    // Handle mongoose validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: "Company with this registration number or email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

// DELETE /api/company - Delete company (Admin only)
export async function DELETE(request: Request) {
  try {
    console.log("🗑️ Deleting company...");

    // Verify admin access
    const { isAdmin, error: authError } = await verifyAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: authError || "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Company ID is required for deletion" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Delete company
    const deletedCompany = await Company.findByIdAndDelete(id);

    if (!deletedCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    console.log("✅ Company deleted:", deletedCompany.companyName);

    return NextResponse.json({
      message: "Company deleted successfully",
      deletedCompany: {
        id: deletedCompany._id,
        companyName: deletedCompany.companyName
      }
    });

  } catch (error) {
    console.error("❌ Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
