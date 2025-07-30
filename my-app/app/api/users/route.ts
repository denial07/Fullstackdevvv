import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// POST /api/users - Create new user
export async function POST(req: NextRequest) {
  try {
    const { name, email, role, company, phone, department, bio } = await req.json();

    if (!name || !email || !role || !company) {
      return NextResponse.json(
        { error: "Name, email, role, and company are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Generate a temporary password (simple random for now)
    const temporaryPassword = Math.random().toString(36).slice(-8);
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      company,
      phone,
      department,
      bio,
      password: hashedPassword,
      status: "active",
      twoFactorEnabled: false,
      loginAlerts: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // TODO: Send email to user with temporary password

    return NextResponse.json({
      message: "User created successfully",
      user: newUser,
      temporaryPassword
    }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// GET /api/users - Get all users
export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find().sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update user or reset password/suspend/delete
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, email, role, company, phone, department, bio, status, resetPassword } = body;

    await connectToDatabase();

    if (resetPassword) {
      // Generate new temporary password
      const newPassword = Math.random().toString(36).slice(-8);
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { password: newPassword, updatedAt: new Date() },
        { new: true }
      );
      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      // TODO: Send email to user with new password
      return NextResponse.json({ message: "Password reset", newPassword });
    }

    // Update user profile/status
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, role, company, phone, department, bio, status, updatedAt: new Date() },
      { new: true }
    );
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "User updated", user: updatedUser });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Delete user
export async function DELETE(req: NextRequest) {
  try {
    const { id } = Object.fromEntries(new URL(req.url).searchParams);
    await connectToDatabase();
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
