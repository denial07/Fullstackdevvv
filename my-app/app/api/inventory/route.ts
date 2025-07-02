import { connectToDatabase } from "@/lib/mongodb"
import Inventory from "@/lib/models/Inventory"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await connectToDatabase()
    const inventory = await Inventory.find().sort({ createdAt: -1 })
    return NextResponse.json(inventory)
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    await connectToDatabase()
    const newItem = await Inventory.create(body)
    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error("Error creating inventory item:", error)
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 })
  }
}
