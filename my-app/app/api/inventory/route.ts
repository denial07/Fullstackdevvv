import { connectToDatabase } from "@/lib/mongodb"
import Inventory from "@/lib/models/Inventory"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    console.log("🔄 API: Starting inventory fetch...")

    // Test connection first
    await connectToDatabase()
    console.log("✅ API: Database connected successfully")

    // Parse URL for pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000') // Default to 1000 items
    const skip = (page - 1) * limit

    // Check if collection exists and count documents
    const count = await Inventory.countDocuments()
    console.log(`📊 API: Found ${count} inventory items in database`)

    if (count === 0) {
      console.log("⚠️ API: No inventory items found. Database might be empty.")
      return NextResponse.json({
        message: "No inventory items found. Please run the seeding script first.",
        data: [],
        isEmpty: true,
        pagination: { page: 1, limit, total: 0, totalPages: 0 }
      })
    }

    const inventory = await Inventory.find()
      .select('_id id item category quantity unit minStock maxStock location receivedDate expiryDate supplier costPerUnit status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() // Use lean() for better performance - returns plain JS objects instead of Mongoose documents
      .exec()
      
    const totalPages = Math.ceil(count / limit)
    
    console.log(`✅ API: Successfully fetched ${inventory.length} inventory items (page ${page}/${totalPages})`)

    return NextResponse.json({
      data: inventory,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error: any) {
    console.error("❌ API Error:", error)

    // Detailed error logging
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName,
    })

    // Provide specific error messages
    let errorMessage = "Failed to fetch inventory"
    let errorDetails = error.message

    if (error.name === "MongooseServerSelectionError") {
      errorMessage = "Cannot connect to MongoDB Atlas"
      errorDetails = "Server selection failed. Check your connection string and network access."
    } else if (error.name === "MongoNetworkError") {
      errorMessage = "Network connection to MongoDB failed"
      errorDetails = "Check your internet connection and MongoDB Atlas status."
    } else if (error.name === "MongooseTimeoutError") {
      errorMessage = "Database connection timeout"
      errorDetails = "The connection to MongoDB Atlas timed out."
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        errorType: error.name,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("🔄 API: Creating new inventory item...")

    await connectToDatabase()
    const newItem = await Inventory.create(body)

    console.log("✅ API: Successfully created inventory item:", newItem.id)
    return NextResponse.json(newItem, { status: 201 })
  } catch (error: any) {
    console.error("❌ API Error creating inventory item:", error)

    return NextResponse.json(
      {
        error: "Failed to create inventory item",
        details: error.message,
        errorType: error.name,
      },
      { status: 500 },
    )
  }
}
