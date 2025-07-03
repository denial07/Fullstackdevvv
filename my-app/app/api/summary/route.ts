import { getShipmentSummary, getInventorySummary, getOrdersSummary } from "@/lib/summaries"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        // Fetch all 3 summaries in parallel
        const [shipmentSummary, inventorySummary, ordersSummary] = await Promise.all([
            getShipmentSummary(),
            getInventorySummary(),
            getOrdersSummary(),
        ])

        // Return them as JSON
        return NextResponse.json({
            shipmentSummary,
            inventorySummary,
            ordersSummary,
        })
    } catch (error) {
        console.error("Error fetching summary data:", error)
        return NextResponse.json({ error: "Failed to fetch summary data" }, { status: 500 })
    }
}
