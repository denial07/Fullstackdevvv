// /app/api/import/commit/route.ts
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import SchemaProfile from "@/lib/models/SchemaProfile";
import ImportSession from "@/lib/models/ImportSession";
import { getEntityModel } from "@/lib/import/model"; // your lookup to ProductModel etc.
import crypto from "crypto";

const norm = (s: string) => s.toLowerCase().trim();

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const file = form.get("file") as File | null;
        const entity = String(form.get("entity") ?? "Shipment");
        const mappingJson = (form.get("mapping") as string) ?? "[]";
        const dupDecisionsJson = (form.get("duplicates") as string) ?? "[]";
        const adoptAsStandard = String(form.get("adoptAsStandard") ?? "false") === "true";

        if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

        const buf = Buffer.from(await file.arrayBuffer());
        const fileHash = crypto.createHash("sha256").update(buf).digest("hex");

        const wb = XLSX.read(buf, { type: "buffer" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null, raw: true });
        if (rawRows.length === 0) return NextResponse.json({ error: "Empty sheet" }, { status: 400 });

        const headers = Object.keys(rawRows[0] ?? {});
        const mapping = JSON.parse(mappingJson) as { incoming: string; mapTo: string }[];
        const dupDecisions = JSON.parse(dupDecisionsJson) as { rowIndex: number; action: "insert" | "skip" }[];

        await connectToDatabase();

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // (A) Adopt this file as the active standard (if requested)
            if (adoptAsStandard) {
                const normalizedFields =
                    mapping.length > 0
                        ? mapping.map((m) => ({ name: m.mapTo, type: "string", aliases: [m.incoming] }))
                        : headers.map((h) => ({ name: norm(h), type: "string", aliases: [] }));

                await SchemaProfile.updateMany({ entity, active: true }, { $set: { active: false } }, { session });
                await SchemaProfile.create([{ entity, version: 1, fields: normalizedFields, active: true }], { session });
            }

            // (B) Apply header mapping to each row
            const mapLut = new Map<string, string>(mapping.map((m) => [norm(m.incoming), norm(m.mapTo)]));
            const mappedRows = rawRows.map((r) => {
                const out: Record<string, any> = {};
                for (const h of headers) {
                    const key = mapLut.get(norm(h)) ?? norm(h);
                    out[key] = r[h];
                }
                return out;
            });

            // (C) Upsert into the chosen entity model
            const Model = getEntityModel(entity);
            if (!Model) throw new Error(`Unknown entity: ${entity}`);

            let inserted = 0;
            let skipped = 0;

            for (let i = 0; i < mappedRows.length; i++) {
                const decision = dupDecisions.find((d) => d.rowIndex === i);
                if (decision?.action === "skip") {
                    skipped++;
                    continue;
                }

                const doc = mappedRows[i];

                // Choose a sensible upsert key (tweak as needed for your schema)
                const filter =
                    doc.id ? { id: doc.id } :
                        doc.trackingNumber ? { trackingNumber: doc.trackingNumber } :
                            doc.sku ? { sku: doc.sku } :
                                { _id: new mongoose.Types.ObjectId() }; // force-insert when no key is available

                await Model.updateOne(
                    filter,
                    { $set: doc, $setOnInsert: { createdAt: new Date() } },
                    { upsert: true, session }
                );
                inserted++;
            }

            await ImportSession.create(
                [
                    {
                        entity,
                        fileHash,
                        status: "COMMITTED",
                        decisions: { mapping, dupDecisions, adoptAsStandard },
                        stats: { inserted, skipped, total: mappedRows.length },
                    },
                ],
                { session }
            );

            await session.commitTransaction();
            session.endSession();
            return NextResponse.json({ ok: true, inserted, skipped });
        } catch (err: any) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message ?? "Internal error" }, { status: 500 });
    }
}
