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
        if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return undefined;
};

const toNum = (v: any) => {
    if (v === "" || v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const toISODateString = (d: Date | null) => {
    if (!d) return "";
    const y = d.getUTCFullYear();
    if (!Number.isFinite(y) || y < 2000) return "";
    return `${y}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

// Excel serial (days since 1899-12-30), supports fractional days
const excelSerialToDate = (serial: number): Date | null => {
    if (!Number.isFinite(serial)) return null;
    const base = Date.UTC(1899, 11, 30);
    const ms = Math.round(serial * 24 * 60 * 60 * 1000);
    return new Date(base + ms);
};

const parseDateFlexible = (v: any): Date | null => {
    if (!v && v !== 0) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === "number") {
        const fromExcel = excelSerialToDate(v);
        if (fromExcel && !isNaN(fromExcel.getTime())) return fromExcel;
        // If someone passed epoch ms accidentally
        const asMs = new Date(v);
        return isNaN(asMs.getTime()) ? null : asMs;
    }
    if (typeof v === "string") {
        // Allow ISO strings
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d;
        // Try numeric strings as excel serials
        const n = Number(v);
        if (Number.isFinite(n)) {
            const ex = excelSerialToDate(n);
            if (ex && !isNaN(ex.getTime())) return ex;
        }
    }
    return null;
};

const titleCase = (s?: string) =>
    (s || "")
        .toLowerCase()
        .replace(/\b\w/g, (m) => m.toUpperCase());

const slug = (s?: string) =>
    (s || "")
        .toString()
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

function isDelivered(status?: string) {
    return typeof status === "string" && /delivered/i.test(status);
}

/** Build a stable Inventory.id from shipment attributes (no ObjectId). */
function deriveInventoryIdFromShipment(s: any): string {
    // Priority: itemid -> sku/code -> vendor|item -> trackingnumber -> shipmentid
    const itemId = first(s, ["itemid", "itemId", "sku", "code", "productCode", "barcode", "ean", "upc"]);
    const vendor = first(s, ["vendor", "supplier", "brand"]);
    const itemName = first(s, ["itemdescription", "item", "productName", "description"]);
    const tracking = first(s, ["trackingnumber", "trackingNumber"]);
    const shipId = first(s, ["shipmentid", "shipmentId"]);

    if (itemId && vendor) return `${slug(String(vendor))}|${slug(String(itemId))}`;
    if (itemId) return slug(String(itemId));
    if (vendor && itemName) return `${slug(String(vendor))}|${slug(String(itemName))}`;
    if (tracking) return slug(String(tracking));
    if (shipId) return slug(String(shipId));
    // last resort: deterministic but readable
    return `INV|${slug(String(itemName || "ITEM"))}`;
}

/** Map a *single-item* shipment (your screenshot fields) → Inventory doc */
function buildInventoryFromShipmentTop(s: any) {
    const quantity =
        toNum(first(s, ["itemquantity", "quantity", "qty", "units", "containers"])) ?? 1;

    const itemName =
        first(s, ["itemdescription", "item", "productName", "description"]) ??
        `Shipment ${s._id}`;

    const unit =
        first(s, ["itemunit", "unit", "uom", "unitOfMeasure"]) ?? "ea";

    const supplier =
        first(s, ["vendor", "supplier", "brand"]) ?? "Unknown";

    const location =
        first(s, ["destination", "warehouse", "originwarehouse", "location", "site"]) ?? "Main";

    const category = titleCase(first(s, ["type", "category"])) || "Incoming";

    // Received date: prefer deliveredDate; else eta/estimateddelivery/shipdate
    const receivedDate =
        toISODateString(
            parseDateFlexible(
                first(s, [
                    "deliveredDate",
                    "deliveredAt",
                    "eta",
                    "estimateddelivery",
                    "shipdate",
                    "receivedDate",
                ])
            )
        ) || toISODateString(new Date());

    // Expiry: only if provided, otherwise ""
    const expiryDate =
        toISODateString(parseDateFlexible(first(s, ["expiryDate", "bestBefore", "exp"]))) || "";

    // costPerUnit: prefer itemunitprice; else derive from price/declaredvalue ÷ quantity
    const explicitCPU = toNum(first(s, ["itemunitprice", "unitPrice"]));
    const totalTop =
        toNum(first(s, ["price", "totalvalue", "declaredvalue", "value", "amount", "cost"])) ?? 0;
    const derivedCPU = quantity > 0 ? Number((totalTop / quantity).toFixed(2)) : 0;
    const costPerUnit = explicitCPU ?? derivedCPU;

    const id = deriveInventoryIdFromShipment(s);

    // min/max defaults — tweak if you have business rules
    const minStock = toNum(first(s, ["minStock", "min"])) ?? 0;
    const maxStock = toNum(first(s, ["maxStock", "max"])) ?? quantity;

    return {
        id,                 // stable, from item/vendor/etc.
        item: itemName,     // human friendly
        category,
        quantity,
        unit,
        minStock,
        maxStock,
        location,
        receivedDate,       // "YYYY-MM-DD"
        expiryDate,         // "" if not provided
        supplier,
        costPerUnit,
        status: "In Stock",
    };
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
            const raw = await req.text();
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

        // 5) If status changed to Delivered, upsert ONE Inventory doc from top-level shipment fields
        const isNowDelivered = isDelivered(updated?.status);
        if (!wasDelivered && isNowDelivered) {
            const invDoc = buildInventoryFromShipmentTop(updated);
            await Inventory.updateOne({ id: invDoc.id }, { $set: invDoc }, { upsert: true });
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
