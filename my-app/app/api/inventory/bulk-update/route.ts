import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function PATCH(request: Request) {
  try {
    const { itemIds, updates } = await request.json()

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "Item IDs array is required" },
        { status: 400 }
      )
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Updates object is required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Update multiple items at once
    const result = await db.collection("inventory").updateMany(
      { id: { $in: itemIds } },
      { $set: updates }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No items found with the provided IDs" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} items`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      updates
    })

  } catch (error) {
    console.error("Error updating inventory items:", error)
    return NextResponse.json(
      { error: "Failed to update inventory items" },
      { status: 500 }
    )
  }
}
