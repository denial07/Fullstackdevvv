import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Employee from "@/lib/models/Employee";
import User from "@/lib/models/User";

// Helper function to verify authentication token and get user info
async function verifyUser(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      throw new Error("No token provided");
    }

    // Decode the session token (same format as login API)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired (24 hours)
    if (Date.now() - decoded.timestamp > 24 * 60 * 60 * 1000) {
      throw new Error("Token expired");
    }

    await connectToDatabase();
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch {
    throw new Error("Unauthorized");
  }
}

// GET /api/employees/[id] - Get single employee
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyUser(request);
    
    if (user.role !== "Administrator" && user.role !== "Manager") {
      return NextResponse.json(
        { error: "Access denied. Manager or Administrator role required." },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const employee = await Employee.findById(params.id);
    
    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Check if manager can access this employee
    if (user.role === "Manager" && employee.department !== user.department) {
      return NextResponse.json(
        { error: "Access denied. You can only view employees in your department." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch employee";
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Unauthorized" ? 401 : 500 }
    );
  }
}

// PUT /api/employees/[id] - Update employee (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyUser(request);
    
    if (user.role !== "Administrator") {
      return NextResponse.json(
        { error: "Access denied. Administrator role required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    await connectToDatabase();

    const employee = await Employee.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
      message: "Employee updated successfully"
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update employee";
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Delete employee (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyUser(request);
    
    if (user.role !== "Administrator") {
      return NextResponse.json(
        { error: "Access denied. Administrator role required." },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const employee = await Employee.findByIdAndDelete(params.id);

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Employee deleted successfully"
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete employee";
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
