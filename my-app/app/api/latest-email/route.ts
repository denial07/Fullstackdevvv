import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

// GET /api/latest-email - Get the most recently logged in user's email
export async function GET() {
  try {
    await connectToDatabase();
    
    // First try to get from localStorage-like storage (remembered email)
    // If that fails, get the most recently updated user (likely last login)
    const latestUser = await User.findOne()
      .sort({ updatedAt: -1 }) // Sort by most recently updated (which happens on login)
      .select('email name')
      .limit(1);

    if (!latestUser) {
      return NextResponse.json({
        email: null,
        message: "No users found"
      });
    }

    console.log(`📧 Latest email retrieved: ${latestUser.email}`);

    return NextResponse.json({
      email: latestUser.email,
      message: "Latest email retrieved successfully"
    });

  } catch (error) {
    console.error("❌ Latest email fetch error:", error);
    return NextResponse.json(
      { 
        email: null,
        error: "Failed to fetch latest email" 
      },
      { status: 500 }
    );
  }
}
