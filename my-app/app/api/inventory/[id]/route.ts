import { connectToDatabase } from "@/lib/mongodb"
import Inventory from "@/lib/models/Inventory"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const item = await Inventory.findOne({ id: params.id })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error: any) {
    console.error("❌ API Error fetching item:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch item",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log(`🔄 API: Updating inventory item ${params.id}...`)

    const body = await request.json()
    const { quantity } = body

    // Validate quantity
    if (quantity === undefined || quantity < 0) {
      return NextResponse.json({ error: "Invalid quantity. Must be 0 or greater." }, { status: 400 })
    }

    await connectToDatabase()

    // Find the current item to get minStock for status calculation
    const currentItem = await Inventory.findOne({ id: params.id })

    if (!currentItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Calculate new status based on quantity and minStock
    let newStatus = "Good"
    if (quantity <= currentItem.minStock) {
      newStatus = "Low Stock"
    }

    // Check if item is expired or expiring soon
    const today = new Date()
    const expiryDate = new Date(currentItem.expiryDate)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      newStatus = "Expired"
    } else if (daysUntilExpiry <= 30) {
      newStatus = "Expiring Soon"
    }

    // Update the item in the database
    const updatedItem = await Inventory.findOneAndUpdate(
      { id: params.id },
      {
        quantity: quantity,
        status: newStatus,
        updatedAt: new Date(),
      },
      { new: true }, // Return the updated document
    )

    if (!updatedItem) {
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
    }

    console.log(`✅ API: Successfully updated ${params.id} quantity to ${quantity}`)

    return NextResponse.json({
      id: updatedItem.id,
      quantity: updatedItem.quantity,
      status: updatedItem.status,
      message: "Stock level updated successfully",
    })
  } catch (error: any) {
    console.error("❌ API Error updating inventory item:", error)

    return NextResponse.json(
      {
        error: "Failed to update inventory item",
        details: error.message,
        errorType: error.name,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log(`🔄 API: Deleting inventory item ${params.id}...`)

    await connectToDatabase()

    const deletedItem = await Inventory.findOneAndDelete({ id: params.id })

    if (!deletedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    console.log(`✅ API: Successfully deleted item ${params.id}`)

    return NextResponse.json({
      message: "Item deleted successfully",
      deletedItem: {
        id: deletedItem.id,
        item: deletedItem.item,
      },
    })
  } catch (error: any) {
    console.error("❌ API Error deleting inventory item:", error)

    return NextResponse.json(
      {
        error: "Failed to delete inventory item",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
