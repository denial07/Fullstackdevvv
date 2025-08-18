// /app/api/import-2/commit/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import ImportSession from "@/lib/models/ImportSession";
import { getEntityModel } from "@/lib/import/model";

function normalizeHeader(h: string) {
    return h.toLowerCase().replace(/[\s_\-\/]+/g, " ").trim();
}

export async function POST(req: NextRequest) {
    // parse form
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const entity = String(form.get("entity") ?? "Shipment");
    const mappingJson = (form.get("mapping") as string) ?? "[]";
    const dupDecisionsJson = (form.get("duplicates") as string) ?? "[]";
    const adoptAsStandard = String(form.get("adoptAsStandard") ?? "false") === "true";
    const importId = (form.get("importId") as string) || null; // optional

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const fileHash = crypto.createHash("sha256").update(buf).digest("hex");

    // read sheet
    const { read, utils } = await import("xlsx");
    const wb = read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = utils.sheet_to_json<Record<string, any>>(ws, { defval: null, raw: true });
    if (rawRows.length === 0) return NextResponse.json({ error: "Empty sheet" }, { status: 400 });

    const originalHeaders = Object.keys(rawRows[0] ?? {});
    const normalizedHeaders = originalHeaders.map(normalizeHeader);

    // mapping/dup decisions from client
    const mapping = JSON.parse(mappingJson) as { incoming: string; mapTo: string }[];
    const dupDecisions = JSON.parse(dupDecisionsJson) as { rowIndex: number; action: "insert" | "skip" }[];

    // build normalized→target map
    const map = new Map(mapping.map(m => [normalizeHeader(m.incoming), m.mapTo]));

    // materialize mapped rows
    const mappedRows = rawRows.map(r => {
        const obj: Record<string, any> = {};
        for (let i = 0; i < originalHeaders.length; i++) {
            const nh = normalizedHeaders[i];
            const target = map.get(nh) ?? nh; // default to normalized name
            obj[target] = r[originalHeaders[i]];
        }
        return obj;
    });

    await connectToDatabase();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const Model = getEntityModel(entity);
        if (!Model) throw new Error(`Unknown entity: ${entity}`);

        // upsert each row (pick your business key; example uses 'id' or 'trackingNumber')
        let inserted = 0, skipped = 0;
        for (let i = 0; i < mappedRows.length; i++) {
            const decision = dupDecisions.find(d => d.rowIndex === i);
            if (decision?.action === "skip") { skipped++; continue; }

            const doc = mappedRows[i];
            const filter =
                doc.id ? { id: doc.id } :
                    doc.trackingNumber ? { trackingNumber: doc.trackingNumber } :
                        // last-resort hash; replace with your real business key(s)
                        { _docHash: crypto.createHash("md5").update(JSON.stringify(doc)).digest("hex") };

            await Model.updateOne(
                filter,
                { $set: doc, $setOnInsert: { createdAt: new Date() } },
                { upsert: true, session }
            );
            inserted++;
        }

        // ✅ idempotent ImportSession write (no duplicate key)
        const match = importId
            ? { _id: new mongoose.Types.ObjectId(importId) }
            : { entity, fileHash };

        await ImportSession.findOneAndUpdate(
            match,
            {
                $set: {
                    entity,
                    fileHash,
                    status: "COMMITTED",
                    decisions: { mapping, dupDecisions, adoptAsStandard },
                    stats: { inserted, skipped, total: mappedRows.length },
                    updatedAt: new Date(),
                },
                $setOnInsert: { createdAt: new Date() },
            },
            { new: true, upsert: true, session }
        );

        await session.commitTransaction();
        session.endSession();
        return NextResponse.json({ ok: true, inserted, skipped });
    } catch (e: any) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
