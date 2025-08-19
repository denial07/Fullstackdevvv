// app/api/dev/backfill-inventory/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

const DELIVERED = ["delivered", "arrived", "received"];

function isDeliveredStatus(v: any) {
    return v && DELIVERED.includes(String(v).toLowerCase());
}

export async function POST() {
    const db = await connectToDatabase();
    const shipments = db.collection("shipments");
    const inventory = db.collection("inventory");

    const cursor = shipments.find({ status: { $in: DELIVERED } });
    let inserted = 0, skipped = 0;

    while (await cursor.hasNext()) {
        const s = await cursor.next();
        if (!s) continue;

        const res = await inventory.updateOne(
            { sourceShipmentId: s._id.toString() },
            {
                $setOnInsert: {
                    sourceShipmentId: s._id.toString(),
                    status: "In Stock",
                    receivedAt: new Date(),
                    sku: s.sku ?? `SHIP-${s._id}`,
                    description: s.description ?? s.desc ?? "",
                    qty: Number(s.qty ?? s.quantity ?? 0),
                    uom: s.uom ?? "ea",
                    warehouse: s.warehouse ?? s.location ?? "Main",
                    meta: { vendor: s.vendor ?? s.supplier, tracking: s.tracking ?? s.trackingNumber },
                    lastSyncedAt: new Date(),
                },
                $set: { lastSyncedAt: new Date() },
            },
            { upsert: true }
        );
        if (res.upsertedCount) inserted++;
        else skipped++;
    }

    return NextResponse.json({ ok: true, inserted, skipped });
}
