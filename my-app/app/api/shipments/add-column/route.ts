import { connectToDatabase } from "@/lib/mongodb";
import Shipment from "@/lib/models/Shipment";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectToDatabase();
        const shipments = await Shipment.find().lean();
        return NextResponse.json(shipments);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch shipments" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { columnKey } = await req.json();

        if (!columnKey || typeof columnKey !== "string") {
            return NextResponse.json({ error: "Missing or invalid column key" }, { status: 400 });
        }

        await connectToDatabase();

        // ✅ Apply to ALL documents, not just those missing the key
        await Shipment.updateMany({}, {
            $set: { [columnKey]: null }
        });

        return NextResponse.json({ message: `Column '${columnKey}' added to all documents.` }, { status: 200 });
    } catch (error) {
        console.error("❌ Error updating shipments with new column:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

