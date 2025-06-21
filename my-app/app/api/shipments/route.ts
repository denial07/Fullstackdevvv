import { connectToDatabase } from "@/lib/mongodb";
import Shipment from "@/lib/models/Shipment";
import { NextResponse } from "next/server";

export async function GET() {
    await connectToDatabase();
    const shipments = await Shipment.find();
    return NextResponse.json(shipments);
}

export async function POST(req: Request) {
    const body = await req.json();
    await connectToDatabase();
    const newShipment = await Shipment.create(body);
    return NextResponse.json(newShipment, { status: 201 });
}
