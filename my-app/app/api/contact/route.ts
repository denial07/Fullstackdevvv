import { connectToDatabase } from "@/lib/mongodb";
import ContactRequest from "@/lib/models/ContactRequest";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// POST /api/contact - Submit contact request
export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
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

    // Connect to database
    await connectToDatabase();

    // Save contact request to database
    const contactRequest = await ContactRequest.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim()
    });

    console.log("💾 Contact request saved:", contactRequest._id);

    // Setup email transporter (using Gmail as example)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });

    // Email to administrator
    const adminEmail = {
      from: process.env.EMAIL_USER || 'noreply@palletworks.sg',
      to: 'admin@palletworks.sg',
      subject: `🔐 New Dashboard Access Request - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            New Dashboard Access Request
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Contact Details:</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Request ID:</strong> ${contactRequest._id}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #374151;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #dbeafe; border-radius: 8px;">
            <p style="margin: 0; color: #1e40af;">
              <strong>Next Steps:</strong> Please review this request and contact ${name} at ${email} to provide dashboard access if approved.
            </p>
          </div>
        </div>
      `
    };

    // Confirmation email to user
    const userEmail = {
      from: process.env.EMAIL_USER || 'noreply@palletworks.sg',
      to: email,
      subject: '✅ Access Request Received - Singapore Pallet Works',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            Access Request Received
          </h2>
          
          <p>Hello ${name},</p>
          
          <p>Thank you for your interest in accessing the Singapore Pallet Works Dashboard. We have received your access request and will review it shortly.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h3 style="margin-top: 0; color: #166534;">Request Summary:</h3>
            <p><strong>Request ID:</strong> ${contactRequest._id}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Your Message:</strong></p>
            <p style="white-space: pre-wrap; background-color: #fff; padding: 15px; border-radius: 4px; border: 1px solid #d1d5db;">${message}</p>
          </div>
          
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;">
              <strong>What's Next?</strong><br>
              • Our administrator will review your request within 24 hours<br>
              • You will receive login credentials via email if approved<br>
              • If you have any questions, reply to this email
            </p>
          </div>
          
          <p>Best regards,<br>
          Singapore Pallet Works Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            This is an automated message. Please do not reply to this email address.
          </p>
        </div>
      `
    };

    try {
      // Send emails
      await Promise.all([
        transporter.sendMail(adminEmail),
        transporter.sendMail(userEmail)
      ]);
      
      console.log("📧 Emails sent successfully");
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      // Continue anyway - request is saved in database
    }

    return NextResponse.json({
      message: "Contact request submitted successfully",
      requestId: contactRequest._id,
      status: "pending"
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Contact request error:", error);
    return NextResponse.json(
      { error: "Failed to submit contact request" },
      { status: 500 }
    );
  }
}

// GET /api/contact - Get all contact requests (for admin)
export async function GET() {
  try {
    await connectToDatabase();
    
    const requests = await ContactRequest.find()
      .sort({ createdAt: -1 })
      .limit(50);
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error("❌ Error fetching contact requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact requests" },
      { status: 500 }
    );
  }
}

// PUT /api/contact - Update contact request status
export async function PUT(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    // Validate input
    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status are required" },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['pending', 'reviewed', 'responded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: pending, reviewed, or responded" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Update the contact request
    const updatedRequest = await ContactRequest.findByIdAndUpdate(
      id,
      { 
        status: status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedRequest) {
      return NextResponse.json(
        { error: "Contact request not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Contact request ${id} status updated to: ${status}`);

    return NextResponse.json({
      message: `Contact request marked as ${status}`,
      request: updatedRequest
    });

  } catch (error) {
    console.error("❌ Error updating contact request:", error);
    return NextResponse.json(
      { error: "Failed to update contact request" },
      { status: 500 }
    );
  }
}
