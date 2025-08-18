// /app/api/import-2/commit/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import ImportSession from "@/lib/models/ImportSession";
import SchemaProfile from "@/lib/models/SchemaProfile";
import { getEntityModel } from "@/lib/import/model";
import type { FieldDef } from "@/lib/import/header-map";

const normalizeHeader = (h: string) =>
    h.toLowerCase().replace(/[\s_\-\/]+/g, " ").trim();

export async function POST(req: NextRequest) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const entity = String(form.get("entity") ?? "Shipment").trim().toLowerCase();
    const mappingJson = (form.get("mapping") as string) ?? "[]";
    const dupDecisionsJson = (form.get("duplicates") as string) ?? "[]";
    const adoptAsStandard = String(form.get("adoptAsStandard") ?? "false") === "true";
    const importId = (form.get("importId") as string) || null;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const fileHash = crypto.createHash("sha256").update(buf).digest("hex");

    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null, raw: true });
    if (!rawRows.length) return NextResponse.json({ error: "Empty sheet" }, { status: 400 });

    const originalHeaders = Object.keys(rawRows[0] ?? {});
    const normalizedHeaders = originalHeaders.map(normalizeHeader);

    const mapping = JSON.parse(mappingJson) as { incoming: string; mapTo: string }[];
    const dupDecisions = JSON.parse(dupDecisionsJson) as { rowIndex: number; action: "insert" | "skip" }[];

    const toTarget = new Map<string, string>();
    for (const m of mapping) toTarget.set(normalizeHeader(m.incoming), normalizeHeader(m.mapTo));

    const mappedRows = rawRows.map((r) => {
        const out: Record<string, any> = {};
        for (let i = 0; i < originalHeaders.length; i++) {
            const nh = normalizedHeaders[i];
            const target = toTarget.get(nh) ?? nh;
            out[target] = r[originalHeaders[i]];
        }
        return out;
    });

    await connectToDatabase();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const Model = getEntityModel(entity);
        if (!Model) throw new Error(`Unknown entity: ${entity}`);

        // upsert data rows
        const keyPriority = ["id", "shipmentid", "trackingnumber", "orderid", "sku"];
        const filterFor = (doc: Record<string, any>) => {
            for (const k of keyPriority) if (doc[k] != null && doc[k] !== "") return { [k]: doc[k] };
            return { _docHash: crypto.createHash("md5").update(JSON.stringify(doc)).digest("hex") };
        };

        let inserted = 0, skipped = 0;
        for (let i = 0; i < mappedRows.length; i++) {
            const decision = dupDecisions.find((d) => d.rowIndex === i);
            if (decision?.action === "skip") { skipped++; continue; }
            const filter = filterFor(mappedRows[i]);
            await Model.updateOne(filter, { $set: mappedRows[i], $setOnInsert: { createdAt: new Date() } }, { upsert: true, session });
            inserted++;
        }

        // ADOPT AS NEW STANDARD — create or replace active schema profile
        if (adoptAsStandard) {
            // collect samples by target field
            const byTarget = new Map<string, any[]>();
            for (let c = 0; c < originalHeaders.length; c++) {
                const incomingNorm = normalizedHeaders[c];
                const target = toTarget.get(incomingNorm) ?? incomingNorm;
                if (!byTarget.has(target)) byTarget.set(target, []);
            }
            const MAX_SAMPLES = 200;
            for (const r of rawRows) {
                for (let c = 0; c < originalHeaders.length; c++) {
                    const incomingNorm = normalizedHeaders[c];
                    const target = toTarget.get(incomingNorm) ?? incomingNorm;
                    const arr = byTarget.get(target)!;
                    if (arr.length < MAX_SAMPLES) arr.push(r[originalHeaders[c]]);
                }
            }

            // infer type per target (swap to Gemini if you want)
            const { inferColumnType } = await import("@/lib/import/type-infer");
            type NewField = { name: string; type: FieldDef["type"]; aliases: string[] };
            const newFields: NewField[] = [];
            for (const [name, samples] of byTarget) {
                const { type } = inferColumnType(samples);
                const aliases = mapping
                    .filter((m) => normalizeHeader(m.mapTo) === name)
                    .map((m) => normalizeHeader(m.incoming));
                newFields.push({ name, type, aliases });
            }

            // deactivate old & insert new (version++)
            const current = await SchemaProfile.findOne({ entity, active: true })
                .select({ version: 1 })
                .session(session);

            await SchemaProfile.updateMany({ entity, active: true }, { $set: { active: false } }, { session });

            await SchemaProfile.create(
                [{
                    entity,                               // always normalized
                    version: (current?.version ?? 0) + 1, // increment version
                    active: true,
                    fields: newFields,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }],
                { session }
            );
        }

        // ImportSession upsert (idempotent)
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
        return NextResponse.json({ error: e?.message || "Commit failed" }, { status: 500 });
    }
}
