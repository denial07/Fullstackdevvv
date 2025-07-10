import { connectToDatabase } from "@/lib/mongodb";
import Shipment from "@/lib/models/Shipment";
import { NextResponse } from "next/server";

export async function GET() {
    await connectToDatabase();

    // 1) get plain JS objects, not full Mongoose docs
    const shipments = await Shipment.find().lean();

    // 2) ensure Dates and ObjectIds become strings, drop any toJSON baggage
    const safe = JSON.parse(JSON.stringify(shipments));

    return NextResponse.json(safe);
}


export async function POST(req: Request) {
    try {
        const data = await req.json();
        console.log("🚚 Received shipment data:", data); // log incoming

        await connectToDatabase();
        const newShipment = await Shipment.create(data);
        return NextResponse.json(newShipment, { status: 201 });
    } catch (error) {
        console.error("❌ Error creating shipment:", error);
        return NextResponse.json({ error: "Failed to create shipment" }, { status: 500 });
    }
}
