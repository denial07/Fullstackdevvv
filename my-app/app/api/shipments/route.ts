import { connectToDatabase } from "@/lib/mongodb";
import Shipment from "@/lib/models/Shipment";
import { NextResponse } from "next/server";

export async function GET() {
    await connectToDatabase();
    const shipments = await Shipment.find();
    return NextResponse.json(shipments);
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
