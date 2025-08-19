import { connectToDatabase } from "@/lib/mongodb";
import Shipment from "@/lib/models/Shipment";
import Inventory from "@/lib/models/Inventory";
import { NextResponse } from "next/server";

/** helpers */
const isDelivered = (val: unknown) =>
    typeof val === "string" && val.trim().toLowerCase() === "delivered";

const first = (obj: Record<string, any>, keys: string[]) => {
    for (const k of keys) {
        const v = obj?.[k];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
};

const toNum = (v: any) => {
    if (v === "" || v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

const toDateStr = (v?: any) => {
    if (!v) return new Date().toISOString().slice(0, 10);
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
};

/** Map Shipment -> Inventory (matches your current Inventory schema) */
function buildInventoryFromShipment(s: any, idForInventory: string) {
    const qty =
        toNum(first(s, ["qty", "quantity", "units", "containers"])) ?? 0;

    // Try to compute a reasonable unit cost if we have declared value
    const totalValue =
        toNum(first(s, ["declaredvalue", "value", "amount", "cost"])) ?? 0;
    const costPerUnit = qty > 0 ? Number((totalValue / qty).toFixed(2)) : 0;

    const receivedDate =
        toDateStr(first(s, ["deliveredAt", "arrivalDate", "receivedDate", "eta"]));
    const expiryDate =
        toDateStr(first(s, ["expiryDate", "exp", "bestBefore"]));

    return {
        // 🔑 Use Inventory.id as the dedupe key (no model change needed)
        id: idForInventory,

        // Required fields in your schema:
        item:
            first(s, ["description", "desc", "item", "productName"]) ??
            `Shipment ${s._id}`,
        category: first(s, ["category", "type"]) ?? "Uncategorized",
        quantity: qty,
        unit: first(s, ["unit", "uom", "unitOfMeasure"]) ?? "ea",
        minStock: toNum(first(s, ["minStock", "min"])) ?? 0,
        maxStock: toNum(first(s, ["maxStock", "max"])) ?? qty,
        location: first(s, ["warehouse", "location", "site"]) ?? "Main",
        receivedDate,                  // string per your schema
        expiryDate,                    // string per your schema
        supplier: first(s, ["vendor", "supplier"]) ?? "Unknown",
        costPerUnit,
        status: "In Stock",
    };
}

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        await connectToDatabase();
        const shipment = await Shipment.findById(params.id);

        if (!shipment) {
            return new Response(JSON.stringify({ error: "Shipment not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify(shipment), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in GET handler:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        await connectToDatabase();

        const update = await req.json();

        // 1) Load existing shipment to compare previous status
        const prev = await Shipment.findById(params.id);
        if (!prev) {
            return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
        }
        const wasDelivered = isDelivered(prev.status);

        // 2) Apply update
        const updated = await Shipment.findByIdAndUpdate(params.id, update, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
        }

        // 3) If status changed to Delivered, upsert into Inventory
        const isNowDelivered = isDelivered(updated.status);
        if (!wasDelivered && isNowDelivered) {
            // 👇 Dedupe key:
            // prefer explicit transfer_shipment_id if present, else fallback to shipment _id
            const transferId =
                String(
                    first(updated, [
                        "transfer_shipment_id",
                        "transferShipmentId",
                        "transferId",
                    ]) ?? updated._id
                );

            const invDoc = buildInventoryFromShipment(updated, transferId);

            // upsert by Inventory.id — because your schema already has `id: { unique: true }`
            await Inventory.updateOne(
                { id: transferId },
                { $setOnInsert: invDoc },
                { upsert: true }
            );
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error in PATCH handler:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        await connectToDatabase();
        const deleted = await Shipment.findByIdAndDelete(params.id);

        if (!deleted) {
            return new Response("Shipment not found", { status: 404 });
        }

        return new Response("Shipment deleted successfully", { status: 200 });
    } catch (error) {
        console.error("Error in DELETE handler:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
