import { connectToDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔄 Testing database connection...")

    // Test the connection
    const connection = await connectToDatabase()

    // Try to ping the database
    const admin = connection.connection.db?.admin()
    const pingResult = await admin?.ping()

    console.log("✅ Database connection test successful")
    console.log("Ping result:", pingResult)

    return NextResponse.json({
      status: "success",
      message: "Database connection is working properly",
      timestamp: new Date().toISOString(),
      pingResult,
    })
  } catch (error: any) {
    console.error("❌ Database connection test failed:", error)

    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
