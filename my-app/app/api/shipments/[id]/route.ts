import { connectToDatabase } from "@/lib/mongodb";
import Shipment from "@/lib/models/Shipment";
import Inventory from "@/lib/models/Inventory";
import { NextResponse } from "next/server";

/** helpers */
const isDelivered = (val: unknown) => {
    if (typeof val === "string") return val.trim().toLowerCase() === "delivered";
    if (typeof val === "boolean") return val;
    return false;
};

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
    const y = d.getUTCFullYear();
    if (Number.isNaN(d.getTime()) || y < 2000) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
};

const getPrimaryItem = (s: any) =>
    s?.item && typeof s.item === "object"
        ? s.item
        : Array.isArray(s?.items) && s.items.length > 0
            ? s.items[0]
            : null;

/** Map Shipment -> Inventory (matches your current Inventory schema) */
function buildInventoryFromShipment(s: any, idForInventory: string) {
    const itemsArr: any[] =
        Array.isArray(s?.items) ? s.items : s?.item ? [s.item] : [];

    // total quantity across items; fall back to top-level
    const qtyFromItems =
        itemsArr.reduce((sum, it) => sum + (toNum(it?.quantity) || 0), 0) || 0;
    const qtyTopLevel =
        toNum(first(s, ["qty", "quantity", "units", "containers"])) || 0;
    const qty = qtyFromItems || qtyTopLevel;

    // total value: prefer top-level monetaries; fall back to Σ(q * unitPrice)
    const topLevelTotal =
        toNum(
            first(s, [
                "price",           // <-- important (your data has this)
                "totalvalue",
                "declaredvalue",
                "value",
                "amount",
                "cost",
            ])
        ) || 0;

    const itemsTotal =
        itemsArr.reduce(
            (sum, it) => sum + (toNum(it?.unitPrice) || 0) * (toNum(it?.quantity) || 0),
            0
        ) || 0;

    const totalValue = topLevelTotal || itemsTotal;

    const costPerUnit =
        qty > 0 ? Number((totalValue / qty).toFixed(2)) :
            toNum(getPrimaryItem(s)?.unitPrice) || 0;

    // names/labels
    const primary = getPrimaryItem(s);
    const itemName =
        primary?.description ??
        primary?.name ??
        primary?.sku ??
        first(s, ["description", "desc", "item", "productName"]) ??
        `Shipment ${s._id}`;

    // unit: prefer primary item; else top-level; else default
    const unit =
        primary?.unit ??
        first(s, ["unit", "uom", "unitOfMeasure"]) ??
        "ea";

    // dates
    const receivedDate = toDateStr(
        first(s, ["deliveredAt", "arrivalDate", "receivedDate", "eta"])
    );
    const expiryDate = toDateStr(first(s, ["expiryDate", "exp", "bestBefore"]));

    return {
        id: idForInventory,                // de-dupe key
        item: itemName,                    // e.g., "Woods"
        category: first(s, ["category", "type"]) ?? "Uncategorized",
        quantity: qty,
        unit,
        minStock: toNum(first(s, ["minStock", "min"])) ?? 0,
        maxStock: toNum(first(s, ["maxStock", "max"])) ?? qty,
        location: first(s, ["warehouse", "location", "site"]) ?? "Main",
        receivedDate,                      // string per your schema
        expiryDate,                        // string per your schema
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
            return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
        }

        return NextResponse.json(shipment, { status: 200 });
    } catch (error) {
        console.error("Error in GET handler:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

        // 3) If status changed to Delivered, upsert into Inventory (update if exists)
        const isNowDelivered = isDelivered(updated.status);
        if (!wasDelivered && isNowDelivered) {
            const transferId = String(
                first(updated, ["transfer_shipment_id", "transferShipmentId", "transferId"]) ??
                updated._id
            );

            const invDoc = buildInventoryFromShipment(updated, transferId);

            // Update on subsequent deliveries/edits; create if missing
            await Inventory.updateOne(
                { id: transferId },
                { $set: invDoc },
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
