import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";

// POST /api/login/complete - Complete login after 2FA verification
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create a simple session token (in production, use proper JWT)
    const sessionToken = Buffer.from(
      JSON.stringify({
        userId: user._id,
        email: user.email,
        role: user.role,
        timestamp: Date.now()
      })
    ).toString('base64');

    // Return user data without password
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      phone: user.phone,
      department: user.department
    };

    // Check for new device and send login alert if needed (non-blocking)
    // This runs in the background and won't affect the login process
    setImmediate(async () => {
      try {
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const ipAddress = req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         'Unknown';

        console.log(`🔔 Attempting login alert check for: ${user.email}`);

        const alertResponse = await fetch(`${req.nextUrl.origin}/api/login-alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress.split(',')[0].trim(),
            userAgent
          }),
        });

        if (alertResponse.ok) {
          const alertData = await alertResponse.json();
          console.log(`🔔 Login alert check completed:`, alertData.message);
        } else {
          const errorData = await alertResponse.json();
          console.log(`⚠️ Login alert failed (non-critical):`, errorData);
        }
      } catch (alertError) {
        console.error("⚠️ Login alert check failed (non-critical):", alertError);
        // Silently fail - don't affect the main login process
      }
    });

    // Set HTTP-only cookie with the session token
    const response = NextResponse.json({
      message: "Login completed successfully",
      user: userData,
      token: sessionToken
    });

    response.cookies.set("auth-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    console.log("✅ Login completed for user:", email);

    return response;

  } catch (error) {
    console.error("❌ Login completion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
