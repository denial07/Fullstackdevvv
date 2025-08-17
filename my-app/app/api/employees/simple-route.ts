import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Employee from "@/lib/models/Employee";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";
    const jobTitle = searchParams.get("jobTitle") || "";

    // Build filter query
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } }
      ];
    }
    
    if (department) {
      filter.department = department;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (jobTitle) {
      filter.jobTitle = { $regex: jobTitle, $options: "i" };
    }

    // Get total count for pagination
    const total = await Employee.countDocuments(filter);

    // Fetch employees with pagination
    const employees = await Employee.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get unique values for filter dropdowns
    const departments = await Employee.distinct("department");
    const statuses = await Employee.distinct("status");
    const jobTitles = await Employee.distinct("jobTitle");

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
          jobTitles: jobTitles.filter(Boolean).sort(),
        },
        userRole: "admin", // Frontend will handle role checking
        userDepartment: "",
      },
    });

  } catch (error: any) {
    console.error("❌ Employee API - GET error:", error);
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

    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ employeeId: data.employeeId });
    if (existingEmployee) {
      return NextResponse.json(
        { error: "Employee ID already exists" },
        { status: 400 }
      );
    }

    // Create new employee
    const employee = await Employee.create(data);
    
    return NextResponse.json({
      success: true,
      data: JSON.parse(JSON.stringify(employee)),
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Employee API - POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
