import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

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

    // Setup email transporter
    // Import nodemailer (move to top if needed)
    // ...existing code...
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Email content to user
    const userMailOptions = {
      from: process.env.EMAIL_USER || 'noreply@palletworks.sg',
      to: email,
      subject: '🎉 Welcome to Singapore Pallet Works Dashboard',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome, ${name}!</h2>
        <p>Your account has been created. Here is your temporary password:</p>
        <p style="font-size: 20px; font-weight: bold; color: #22c55e;">${temporaryPassword}</p>
        <p>Please log in and change your password as soon as possible.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">This is an automated message. Please do not reply to this email.</p>
      </div>`
    };

    // Email content to admin (if user email fails)
    const adminMailOptions = {
      from: process.env.EMAIL_USER || 'noreply@palletworks.sg',
      to: process.env.EMAIL_USER || 'yeexian2007@gmail.com',
      subject: '⚠️ User Creation: Email Delivery Failed',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">User Creation: Email Delivery Failed</h2>
        <p>Failed to deliver account credentials to:</p>
        <p style="font-weight: bold; color: #2563eb;">${email}</p>
        <p>Temporary password: <span style="font-weight: bold; color: #22c55e;">${temporaryPassword}</span></p>
        <p>Please contact the user manually.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">This is an automated message. Please do not reply to this email.</p>
      </div>`
    };

    try {
      await transporter.sendMail(userMailOptions);
      console.log("📧 User credentials sent to:", email);
    } catch (userEmailError) {
      console.error("❌ Failed to send user credentials to:", email, userEmailError);
      // Forward to admin
      try {
        await transporter.sendMail(adminMailOptions);
        console.log("📧 Admin notified of failed user email for:", email);
      } catch (adminEmailError) {
        console.error("❌ Failed to notify admin:", adminEmailError);
      }
    }

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
