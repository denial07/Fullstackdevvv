// app/api/shipments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Shipment from "@/lib/models/Shipment";
import Inventory from "@/lib/models/Inventory";

/* ----------------------------- small helpers ----------------------------- */

const first = (obj: Record<string, any>, keys: string[]) => {
    for (const k of keys) {
        const v = obj?.[k];
        if (v !== undefined && v !== null && String(v) !== "") return v;
    }
    return undefined;
};

const toNum = (v: any) => {
    if (v === "" || v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

const toDateStr = (v?: any) => {
    const today = new Date().toISOString().slice(0, 10);
    if (!v) return today;
    const d = new Date(v);
    const y = d.getUTCFullYear();
    if (Number.isNaN(d.getTime()) || y < 2000) return today;
    return d.toISOString().slice(0, 10);
};

const slug = (s?: string) =>
    (s || "")
        .toString()
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

/** True if status implies delivered */
function isDelivered(status?: string) {
    return typeof status === "string" && /delivered/i.test(status);
}

/** Support items being an array, a single object, a JSON string, or absent */
function normalizeItems(s: any): any[] {
    const raw = s?.items ?? s?.item ?? [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
        } catch {
            return [];
        }
    }
    return raw && typeof raw === "object" ? [raw] : [];
}

/** Choose a single human-readable name from an item or shipment */
function chooseItemName(item: any, shipment: any, fallback: string) {
    return (
        item?.description ??
        item?.name ??
        item?.title ??
        item?.sku ??
        first(shipment, ["description", "desc", "productName"]) ??
        fallback
    );
}

/** Derive a stable Inventory ID based on *item attributes* (not shipment _id) */
function deriveInventoryId(shipment: any, item: any, idx: number): string {
    // Prefer hard identifiers:
    const skuLike =
        first(item, ["sku", "SKU", "code", "productCode", "barcode", "ean", "upc"]) ??
        first(shipment, ["sku", "SKU", "code", "productCode", "barcode", "ean", "upc"]);
    const vendor = first(item, ["vendor", "supplier", "brand"]) ?? first(shipment, ["vendor", "supplier"]);
    const name = chooseItemName(item, shipment, `ITEM-${idx + 1}`);

    if (skuLike && vendor) return `${slug(vendor)}|${slug(String(skuLike))}`;
    if (skuLike) return slug(String(skuLike));
    if (vendor) return `${slug(vendor)}|${slug(String(name))}`;
    // Fallback: name + index to avoid collisions
    return `${slug(String(name))}|IDX-${idx + 1}`;
}

/** Build an Inventory doc for a single item line */
function buildInventoryFromShipmentItem(
    shipment: any,
    item: any,
    idForInventory: string,
    derivedCpuFallback: number
) {
    const qty = toNum(item?.quantity) ?? toNum(item?.qty) ?? 0;
    const unit =
        item?.unit ??
        first(shipment, ["unit", "uom", "unitOfMeasure"]) ??
        "ea";

    const itemName = chooseItemName(item, shipment, `Item ${idForInventory}`);
    const supplier = first(item, ["vendor", "supplier", "brand"]) ?? first(shipment, ["vendor", "supplier"]) ?? "Unknown";
    const location = first(shipment, ["warehouse", "location", "site"]) ?? "Main";
    const category = first(item, ["category", "type"]) ?? first(shipment, ["category", "type"]) ?? "Uncategorized";

    // cost per unit: prefer item.unitPrice; else derived fallback from totals
    const cpuExplicit = toNum(item?.unitPrice);
    const costPerUnit = cpuExplicit ?? derivedCpuFallback ?? 0;

    const receivedDate =
        toDateStr(first(shipment, ["deliveredAt", "deliveredDate", "arrivalDate", "receivedDate", "eta"])) ||
        toDateStr(new Date());
    const expiryDate = toDateStr(first(item, ["expiryDate", "exp", "bestBefore"])) || "";

    return {
        id: idForInventory,        // unique key by item attributes
        item: itemName,            // human-friendly
        category,
        quantity: qty || 0,
        unit,
        minStock: toNum(first(item, ["minStock", "min"])) ?? 0,
        maxStock: toNum(first(item, ["maxStock", "max"])) ?? (qty || 0),
        location,
        receivedDate,
        expiryDate,
        supplier,
        costPerUnit,
        status: "In Stock",
    };
}

/** Compute a per-item fallback CPU using top-level totals if item lacks unitPrice */
function computeDerivedCpuFallbacks(shipment: any, items: any[]): number[] {
    // Sum of item quantities (only numeric)
    const qtys = items.map((it) => toNum(it?.quantity) ?? 0);
    const totalQty = qtys.reduce((a, b) => a + (b || 0), 0);

    // Prefer top-level monetary totals common in your dataset
    const topLevelTotal =
        toNum(
            first(shipment, [
                "price",         // common in your data
                "totalvalue",
                "declaredvalue",
                "value",
                "amount",
                "cost",
            ])
        ) ?? 0;

    const defaultCpu = totalQty > 0 ? Number((topLevelTotal / totalQty).toFixed(2)) : 0;
    return items.map(() => defaultCpu);
}

/* ----------------------------- GET / PATCH / DELETE ----------------------------- */

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await ctx.params;
        await connectToDatabase();

        const shipment = await Shipment.findById(id);
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
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await ctx.params;

        // 0) Validate route + id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid shipment id" }, { status: 400 });
        }

        await connectToDatabase();

        // 1) Parse body robustly (JSON or form)
        const contentType = req.headers.get("content-type") || "";
        let update: any;

        if (contentType.includes("application/json")) {
            const raw = await req.text(); // read once
            if (!raw || !raw.trim()) {
                return NextResponse.json({ error: "Empty request body" }, { status: 400 });
            }
            try {
                update = JSON.parse(raw);
            } catch {
                return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
            }
        } else if (
            contentType.includes("multipart/form-data") ||
            contentType.includes("application/x-www-form-urlencoded")
        ) {
            const fd = await req.formData();
            update = Object.fromEntries(fd.entries());
            if (!Object.keys(update).length) {
                return NextResponse.json({ error: "Empty form body" }, { status: 400 });
            }
        } else {
            // Fallback – try text->JSON, else 415
            const raw = await req.text();
            if (raw && raw.trim()) {
                try {
                    update = JSON.parse(raw);
                } catch {
                    return NextResponse.json({ error: "Unsupported or invalid body" }, { status: 415 });
                }
            } else {
                return NextResponse.json({ error: "Missing request body" }, { status: 400 });
            }
        }

        // 2) Sanitize immutable fields
        for (const k of ["_id", "id", "createdAt", "updatedAt"]) delete update[k];

        // 3) Load existing shipment
        const prev = await Shipment.findById(id);
        if (!prev) {
            return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
        }
        const wasDelivered = isDelivered(prev?.status);

        // 4) Apply update
        const updated = await Shipment.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
        }

        // 5) If status changed to Delivered, upsert Inventory **by item attributes**
        const isNowDelivered = isDelivered(updated?.status);
        if (!wasDelivered && isNowDelivered) {
            const items = normalizeItems(updated);
            if (items.length === 0) {
                // No items: still create one inventory doc based on shipment attributes
                const fallbackKey =
                    first(updated, ["sku", "code", "productCode"]) ??
                    updated.trackingNumber ??
                    `${updated._id}-NOITEM`;
                const derivedCpuFallbacks = [0];
                const inv = buildInventoryFromShipmentItem(
                    updated,
                    {},
                    slug(String(fallbackKey)),
                    derivedCpuFallbacks[0]
                );
                await Inventory.updateOne({ id: inv.id }, { $set: inv }, { upsert: true });
            } else {
                const cpuFallbacks = computeDerivedCpuFallbacks(updated, items);
                // Upsert each item line into Inventory
                for (let i = 0; i < items.length; i++) {
                    const it = items[i];
                    const invId = deriveInventoryId(updated, it, i); // <-- NOT the shipment ObjectId
                    const invDoc = buildInventoryFromShipmentItem(updated, it, invId, cpuFallbacks[i]);
                    await Inventory.updateOne({ id: invDoc.id }, { $set: invDoc }, { upsert: true });
                }
            }
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error in PATCH handler:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await ctx.params;
        await connectToDatabase();

        const deleted = await Shipment.findByIdAndDelete(id);
        if (!deleted) {
            return new Response("Shipment not found", { status: 404 });
        }
        return new Response("Shipment deleted successfully", { status: 200 });
    } catch (error) {
        console.error("Error in DELETE handler:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
