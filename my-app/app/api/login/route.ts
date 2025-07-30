import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// POST /api/login - User authentication
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Prevent suspended accounts from logging in
    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Your account is suspended. Please contact support." },
        { status: 403 }
      );
    }

    // Check password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Return special response indicating 2FA is required
      return NextResponse.json({
        requires2FA: true,
        email: user.email,
        message: "2FA verification required"
      });
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
      message: "Login successful",
      user: userData,
      token: sessionToken
    });

    response.cookies.set("auth-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return response;

  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/login - Check authentication status
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Decode the session token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired (24 hours)
    if (Date.now() - decoded.timestamp > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 401 }
      );
    }
    
    // Connect to database and get fresh user data
    await connectToDatabase();
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
      }
    });

  } catch (error) {
    console.error("❌ Auth check error:", error);
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }
}
