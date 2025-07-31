import { connectToDatabase } from "@/lib/mongodb";
import Shipment from "@/lib/models/Shipment";
import { NextResponse } from "next/server";
import { inferDataTypeWithGemini } from "@/lib/gemini";

// Converts Gemini-inferred type to actual default value
function getDefaultValue(type: string): any {
    switch (type) {
        case "number":
            return 0;
        case "boolean":
            return false;
        case "date":
            return new Date().toISOString(); // ISO string for consistency
        case "string":
        default:
            return "";
    }
}

// POST: Add a new column to all shipments using Gemini for type inference
export async function POST(req: Request) {
    try {
        const { columnKey } = await req.json();

        if (!columnKey || typeof columnKey !== "string") {
            return NextResponse.json({ error: "Missing or invalid column key" }, { status: 400 });
        }

        await connectToDatabase();

        // 🔮 Use Gemini to infer type
        const inferredType = await inferDataTypeWithGemini(columnKey);
        const defaultValue = getDefaultValue(inferredType);

        // ✅ Set new field with default value
        await Shipment.updateMany({}, {
            $set: { [columnKey]: defaultValue }
        });

        return NextResponse.json({
            message: `✅ Column '${columnKey}' added to all shipments with inferred type '${inferredType}' and default value.`,
        });
    } catch (error) {
        console.error("❌ Gemini column inference error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
