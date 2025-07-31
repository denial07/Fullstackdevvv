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

export async function PUT(req: Request) {
    try {
        const { oldKey, newKey } = await req.json();
        console.log("🔁 Rename request:", { oldKey, newKey });

        if (!oldKey || !newKey || typeof oldKey !== "string" || typeof newKey !== "string") {
            return NextResponse.json({ error: "Invalid keys" }, { status: 400 });
        }

        await connectToDatabase();

        const docs = await Shipment.find({ [oldKey]: { $exists: true } });

        console.log(`📦 Found ${docs.length} documents to rename '${oldKey}' ➝ '${newKey}'`);

        for (const doc of docs) {
            const valueToCopy = doc.get(oldKey);

            // Skip if the new key already exists to avoid overwriting
            if (doc.get(newKey) === undefined) {
                doc.set(newKey, valueToCopy);
            }

            doc.set(oldKey, undefined);
            await doc.save();
        }

        return NextResponse.json({ message: `Renamed '${oldKey}' to '${newKey}' in ${docs.length} documents.` });
    } catch (error: any) {
        console.error("❌ Rename error:", error.message);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}



export async function DELETE(req: Request) {
    try {
        const { columnKey } = await req.json();

        if (!columnKey || typeof columnKey !== "string") {
            return NextResponse.json({ error: "Missing or invalid column key" }, { status: 400 });
        }

        await connectToDatabase();

        await Shipment.updateMany({}, {
            $unset: { [columnKey]: "" }
        });

        return NextResponse.json({ message: `Column '${columnKey}' removed from all documents.` });
    } catch (error) {
        console.error("DELETE error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}