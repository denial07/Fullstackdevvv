import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/user/security - Update security settings
export async function PUT(req: NextRequest) {
  try {
    const { loginAlerts, sessionTimeout } = await req.json();
    
    const token = req.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Decode the session token
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const tokenAge = Date.now() - decoded.timestamp;
      
      // Check if token is expired (24 hours)
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return NextResponse.json(
          { error: "Token expired" },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
    
    // Connect to database and update security settings
    await connectToDatabase();
    
    const updateData: Partial<{ loginAlerts: boolean; sessionTimeout: number }> = {};
    
    if (loginAlerts !== undefined) {
      updateData.loginAlerts = Boolean(loginAlerts); // Ensure it's a boolean
    }
    
    if (sessionTimeout !== undefined) {
      const timeoutValue = parseInt(sessionTimeout);
      // Validate session timeout range (5 minutes to 24 hours)
      if (timeoutValue < 5 || timeoutValue > 1440) {
        return NextResponse.json(
          { error: "Session timeout must be between 5 and 1440 minutes" },
          { status: 400 }
        );
      }
      updateData.sessionTimeout = timeoutValue;
    }
    
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        message: "No security settings to update",
        user: { loginAlerts: true } // Default value
      });
    }
    
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { 
        new: true, 
        runValidators: true,
        timeout: 5000 // 5 second timeout
      }
    ).select("-password -resetPasswordToken -resetPasswordExpiry -twoFactorSecret");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("✅ Security settings saved for:", user.email);

    return NextResponse.json({
      message: "Security settings updated successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        loginAlerts: user.loginAlerts !== undefined ? user.loginAlerts : true,
        sessionTimeout: user.sessionTimeout !== undefined ? user.sessionTimeout : 30
      }
    });

  } catch (error) {
    console.error("❌ Security save error:", error);
    return NextResponse.json(
      { error: "Failed to save security settings" },
      { status: 500 }
    );
  }
}
