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


// create a path to the db, db link in .env
// create a model for the faq