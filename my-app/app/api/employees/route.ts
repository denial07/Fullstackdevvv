import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";

// Helper function to verify authentication token and get user info
async function verifyUser(request: NextRequest) {
  try {
    // Debug all cookies
    const allCookies = request.cookies.getAll();
    console.log("🔍 Employee API - All cookies:", allCookies.map(c => `${c.name}=${c.value?.substring(0, 20)}...`));
    
    const token = request.cookies.get("auth-token")?.value;
    console.log("🔍 Employee API - Token check:", token ? `Token found (${token.substring(0, 20)}...)` : "No token");
    
    if (!token) {
      throw new Error("No token provided");
    }

    // Decode the session token (same format as login API)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    console.log("🔍 Employee API - Decoded token:", { userId: decoded.userId, role: decoded.role, email: decoded.email });
    
    // Check if token is expired (24 hours)
    if (Date.now() - decoded.timestamp > 24 * 60 * 60 * 1000) {
      console.log("🔍 Employee API - Token expired");
      throw new Error("Token expired");
    }

    await connectToDatabase();
    const user = await User.findById(decoded.userId).select("-password");
    console.log("🔍 Employee API - User found:", user ? `${user.name} (${user.role})` : "No user");
    
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.log("🔍 Employee API - Auth error:", error);
    throw new Error("Unauthorized");
  }
}

    await connectToDatabase();
    const user = await User.findById(decoded.userId).select("-password");
    console.log("🔍 Employee API - User found:", user ? `${user.name} (${user.role})` : "No user");
    
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.log("🔍 Employee API - Auth error:", error);
    throw new Error("Unauthorized");
  }
}

// GET /api/employees - Get employees based on user role
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";
    const jobTitle = searchParams.get("jobTitle") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "lastName";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build query based on user role
    const query: Record<string, unknown> = {};

    // Role-based filtering
    if (user.role === "Manager") {
      // Managers can only see employees in their department
      query.department = user.department;
    } else if (user.role === "Administrator") {
      // Admins can see all employees
      // No additional filtering needed
    } else {
      // Employees and other roles have no access
      return NextResponse.json(
        { error: "Access denied. Insufficient permissions." },
        { status: 403 }
      );
    }

    // Apply search filters
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (status) {
      query.status = status;
    }

    if (jobTitle) {
      query.jobTitle = { $regex: jobTitle, $options: "i" };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const [employees, totalCount] = await Promise.all([
      Employee.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(query)
    ]);

    // Get unique departments and job titles for filters (based on user permissions)
    const [departments, jobTitles] = await Promise.all([
      Employee.distinct("department", user.role === "Manager" ? { department: user.department } : {}),
      Employee.distinct("jobTitle", user.role === "Manager" ? { department: user.department } : {})
    ]);

    return NextResponse.json({
      success: true,
      data: {
        employees,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        },
        filters: {
          departments: departments.sort(),
          jobTitles: jobTitles.sort(),
          statuses: ["active", "inactive", "terminated"]
        },
        userRole: user.role,
        userDepartment: user.department
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch employees";
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Unauthorized" ? 401 : 500 }
    );
  }
}

// POST /api/employees - Create new employee (Admin only)
export async function POST(request: NextRequest) {
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

    const employee = new Employee(body);
    await employee.save();

    return NextResponse.json({
      success: true,
      data: employee,
      message: "Employee created successfully"
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create employee";
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
