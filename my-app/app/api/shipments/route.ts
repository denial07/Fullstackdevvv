// pages/api/shipments/add-column/route.ts
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
        await connectToDatabase();
        
        const data = await req.json();
        console.log("Creating shipment with data:", data);
        
        // Check if this is a column addition request
        if (data.columnKey) {
            // Handle column addition
            await Shipment.updateMany(
                { [data.columnKey]: { $exists: false } },
                { $set: { [data.columnKey]: null } }
            );
            return NextResponse.json({ message: `Column '${data.columnKey}' added.` }, { status: 200 });
        }
        
        // Handle shipment creation
        const shipment = new Shipment(data);
        const savedShipment = await shipment.save();
        
        console.log("Shipment created successfully:", savedShipment._id);
        return NextResponse.json(savedShipment, { status: 201 });
        
    } catch (error: any) {
        console.error("❌ Error in POST handler:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
