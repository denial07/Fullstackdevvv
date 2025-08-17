import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";

// Transform User document to Employee format for the directory
function transformUserToEmployee(user: Record<string, unknown>) {
  const nameParts = user.name?.toString().split(' ') || ['', ''];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    _id: user._id,
    employeeId: user._id?.toString().slice(-6).toUpperCase() || '', // Use last 6 chars of ID as employee ID
    firstName,
    lastName,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    department: user.department || 'General',
    jobTitle: user.role === 'Administrator' ? 'Administrator' : 
              user.role === 'Manager' ? 'Manager' : 
              'Employee',
    status: user.status === 'active' ? 'active' : 
            user.status === 'suspended' ? 'inactive' : 'inactive',
    role: user.role,
    company: user.company || '',
    bio: user.bio || '',
    dateOfJoining: user.createdAt, // Use account creation date as join date
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value;

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

    await connectToDatabase();

    // Get the current user to check their role and department
    const currentUser = await User.findById(decoded.userId).select("role department");
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to access employee directory
    if (!['Administrator', 'Manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Access denied. Only administrators and managers can access employee directory." },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";
    const role = searchParams.get("role") || "";
    const dateSort = searchParams.get("dateSort") || "";

    // Build filter query
    const filter: Record<string, unknown> = {};
    
    // Managers can only see employees from their own department
    if (currentUser.role === 'Manager') {
      filter.department = currentUser.department;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    
    if (department && department !== "all") {
      // For managers, they can only filter within their own department
      if (currentUser.role === 'Manager') {
        // Ensure they can't override their department restriction
        filter.department = currentUser.department;
      } else {
        // Administrators can filter by any department
        filter.department = department;
      }
    }
    
    if (status && status !== "all" && status !== "all-statuses") {
      // Map directory status to user status
      if (status === "active") {
        filter.status = "active";
      } else if (status === "inactive") {
        filter.status = { $in: ["suspended", "inactive"] };
      }
    }
    
    if (role && role !== "all") {
      filter.role = role;
    }

    console.log("🔍 Employee List API - Filter:", JSON.stringify(filter, null, 2));
    console.log("🔍 Employee List API - DateSort:", dateSort);

    // Build sort criteria based on dateSort parameter
    let sortCriteria: Record<string, 1 | -1> = {};
    if (dateSort === "earliest") {
      sortCriteria = { createdAt: 1 }; // Ascending (oldest first)
      console.log("🔍 Sorting by EARLIEST (oldest first)");
    } else if (dateSort === "latest") {
      sortCriteria = { createdAt: -1 }; // Descending (newest first)
      console.log("🔍 Sorting by LATEST (newest first)");
    } else {
      sortCriteria = { createdAt: -1 }; // Default to latest first
      console.log("🔍 Default sorting by latest");
    }

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Fetch users with pagination (exclude sensitive fields)
    const users = await User.find(filter)
      .select("-password -twoFactorSecret -twoFactorBackupCodes -resetPasswordToken")
      .sort(sortCriteria)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    console.log("🔍 Employee List API - Found users:", users.length);
    // Debug: Log first user's status
    if (users.length > 0) {
      console.log("🔍 Sample user status:", users[0].status);
    }

    // Transform users to employee format
    const employees = users.map(transformUserToEmployee);

    // Get unique values for filter dropdowns
    let departments;
    if (currentUser.role === 'Manager') {
      // Managers can only see their own department
      departments = [currentUser.department];
    } else {
      // Administrators can see all departments
      departments = await User.distinct("department");
    }
    
    const statuses = ["active", "inactive"]; // Map from user statuses
    const roles = await User.distinct("role");

    return NextResponse.json({
      success: true,
      data: {
        employees: JSON.parse(JSON.stringify(employees)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          departments: departments.filter(Boolean).sort(),
          statuses: statuses.filter(Boolean).sort(),
          roles: roles.filter(Boolean).sort(),
        },
        userRole: "admin", // Frontend will handle role checking
        userDepartment: "",
      },
    });

  } catch (error: unknown) {
    console.error("❌ Employee list API - GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await connectToDatabase();

    // Check if user email already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Create new user (employee)
    const user = await User.create({
      ...data,
      status: data.status || 'active',
      twoFactorEnabled: false,
      loginAlerts: true
    });
    
    // Transform to employee format for response
    const employee = transformUserToEmployee(JSON.parse(JSON.stringify(user)));
    
    return NextResponse.json({
      success: true,
      data: JSON.parse(JSON.stringify(employee)),
    }, { status: 201 });

  } catch (error: unknown) {
    console.error("❌ Employee list API - POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
