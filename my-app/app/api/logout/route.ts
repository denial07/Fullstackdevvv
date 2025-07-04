import { NextResponse } from "next/server";

// POST /api/logout - User logout
export async function POST() {
  try {
    // Create response
    const response = NextResponse.json({
      message: "Logout successful"
    });

    // Clear the auth cookie
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
    });

    return response;

  } catch (error) {
    console.error("❌ Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
