import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// GET /api/user/profile - Get user profile (optional - for loading existing data)
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
    
    // Connect to database and get user profile
    await connectToDatabase();
    const user = await User.findById(decoded.userId).select("-password -resetPasswordToken -resetPasswordExpiry");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        phone: user.phone || '',
        department: user.department || '',
        bio: user.bio || '',
        twoFactorEnabled: user.twoFactorEnabled || false
      }
    });

  } catch (error) {
    console.error("❌ Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Create/Update user profile
export async function PUT(req: NextRequest) {
  try {
    const { name, email, phone, department, bio } = await req.json();

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!email || email.trim() === '') {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: "Bio cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

    let savedUser;

    if (existingUser) {
      // Update existing user
      savedUser = await User.findOneAndUpdate(
        { email: email.trim().toLowerCase() },
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || undefined,
          department: department?.trim() || undefined,
          bio: bio?.trim() || undefined
        },
        { new: true, runValidators: true }
      ).select("-password -resetPasswordToken -resetPasswordExpiry");
    } else {
      // Create new user with default password
      const defaultPassword = await bcrypt.hash('password123', 12);
      
      savedUser = await User.create({
        email: email.trim().toLowerCase(),
        password: defaultPassword,
        name: name.trim(),
        role: 'Employee',
        company: 'Singapore Pallet Works',
        phone: phone?.trim() || undefined,
        department: department?.trim() || undefined,
        bio: bio?.trim() || undefined
      });
    }

    if (!savedUser) {
      return NextResponse.json(
        { error: "Failed to save profile" },
        { status: 500 }
      );
    }

    console.log("✅ Profile saved successfully for:", savedUser.email);

    return NextResponse.json({
      message: "Profile saved successfully",
      user: {
        id: savedUser._id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        company: savedUser.company,
        phone: savedUser.phone || '',
        department: savedUser.department || '',
        bio: savedUser.bio || '',
        twoFactorEnabled: savedUser.twoFactorEnabled || false
      }
    });

  } catch (error) {
    console.error("❌ Profile save error:", error);
    
    // Handle duplicate email error
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: "Email address is already registered" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
