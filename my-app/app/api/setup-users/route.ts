import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// GET /api/setup-users - Create test users (development only) - Browser accessible
export async function GET() {
  return POST(); // Reuse the same logic as POST
}

// POST /api/setup-users - Create test users (development only)
export async function POST() {
  try {
    // Only allow this in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    console.log("🌱 Creating test users...");
    
    // Connect to database
    await connectToDatabase();
    
    // Clear existing users
    await User.deleteMany({});
    console.log("🗑️  Cleared existing users");

    // Sample users with hashed passwords
    const saltRounds = 12;
    const users = [
      {
        email: "admin@palletworks.sg",
        password: await bcrypt.hash("admin123", saltRounds),
        name: "Admin User",
        role: "Administrator",
        company: "Singapore Pallet Works",
        phone: "+65 9123 4567",
        department: "Management",
        bio: "System administrator with 5+ years experience in logistics management systems."
      },
      {
        email: "manager@palletworks.sg",
        password: await bcrypt.hash("manager123", saltRounds),
        name: "Manager User",
        role: "Manager",
        company: "Singapore Pallet Works",
        phone: "+65 9234 5678",
        department: "Operations",
        bio: "Operations manager responsible for daily warehouse operations and inventory management."
      },
      {
        email: "employee@palletworks.sg",
        password: await bcrypt.hash("employee123", saltRounds),
        name: "Employee User",
        role: "Employee",
        company: "Singapore Pallet Works",
        phone: "+65 9345 6789",
        department: "Logistics",
        bio: "Logistics coordinator handling shipment tracking and vendor communications."
      }
    ];

    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    return NextResponse.json({
      message: "Test users created successfully",
      users: createdUsers.map(user => ({
        email: user.email,
        name: user.name,
        role: user.role
      })),
      credentials: {
        admin: "admin@palletworks.sg / admin123",
        manager: "manager@palletworks.sg / manager123", 
        employee: "employee@palletworks.sg / employee123"
      }
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error creating test users:", error);
    return NextResponse.json(
      { 
        error: "Failed to create test users", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
