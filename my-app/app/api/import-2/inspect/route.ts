// /app/api/import/inspect/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import crypto from "crypto";

import { connectToDatabase } from "@/lib/mongodb";
import SchemaProfile from "@/lib/models/SchemaProfile";
import ImportSession from "@/lib/models/ImportSession";
import { proposeHeaderMapping, type FieldDef } from "@/lib/import/header-map";
import { buildDuplicateReport } from "@/lib/import/duplicates";
import { getEntityModel } from "@/lib/import/model";

const normalizeHeader = (h: string) =>
    h.toLowerCase().replace(/[\s_\-\/]+/g, " ").trim();

export async function POST(req: NextRequest) {
    // ---- read form/file ----
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const entity = String(form.get("entity") ?? "Shipment");

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const fileHash = crypto.createHash("sha256").update(buf).digest("hex");

    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
        defval: null,
        raw: true,
    });
    if (rows.length === 0)
        return NextResponse.json({ error: "Empty sheet" }, { status: 400 });

    const headers = Object.keys(rows[0] ?? {});
    const normalizedHeaders = headers.map(normalizeHeader);

    // ---- schema profile (cold start vs existing) ----
    await connectToDatabase();
    // after: await connectToDatabase();

    type ProfileField = { name: string; type: FieldDef["type"]; aliases?: string[] };
    type ProfileLean = { fields?: ProfileField[] } | null;

    const activeProfile = (await SchemaProfile
        .findOne({ entity, active: true })
        .lean()) as ProfileLean;

    let fieldDefs: FieldDef[] = [];

    if (!activeProfile?.fields || activeProfile.fields.length === 0) {
        // Cold start — infer types from first ~200 rows
        const { inferColumnType } = await import("@/lib/import/type-infer");
        fieldDefs = normalizedHeaders.map((h) => {
            const idx = normalizedHeaders.indexOf(h);
            const samples = rows.slice(0, 200).map((r) => r[headers[idx]]);
            const { type } = inferColumnType(samples);
            return { name: h, type, aliases: [] };
        });
    } else {
        // Use existing schema profile
        fieldDefs = activeProfile.fields.map((f) => ({
            name: f.name,
            type: f.type,
            aliases: f.aliases ?? [],
        }));
    }


    // ---- build 50-row sample for header/type inference ----
    const sampleRows = rows.slice(0, 50).map((r) => {
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => {
            obj[normalizedHeaders[i]] = r[h];
        });
        return obj;
    });

    const proposals = proposeHeaderMapping(
        normalizedHeaders,
        sampleRows,
        fieldDefs
    );

    // ---- duplicates against current DB (if model exists) ----
    const Model = getEntityModel(entity);
    const existing = Model ? await Model.find().limit(5000).lean() : [];
    const dedupeReport = buildDuplicateReport(rows, headers, existing);

    // ---- persist a DRY_RUN session for audit/idempotency ----
    const sessionDoc = await ImportSession.create({
        entity,
        fileHash,
        stats: {
            rows: rows.length,
            headers: normalizedHeaders,
            hasActiveProfile: !!activeProfile,
            mappingAuto: proposals.filter((p) => p.autoMapped).length,
            mappingNeedUser: proposals.filter((p) => p.needsUserDecision).length,
            potentialDuplicates: dedupeReport.review.length,
            autoInsertCandidates: dedupeReport.autoInsert.length,
        },
        status: "DRY_RUN",
    });

    return NextResponse.json({
        importId: String(sessionDoc._id),
        sheet: wb.SheetNames[0],
        headers: normalizedHeaders,
        schemaStatus: activeProfile
            ? "USING_EXISTING_STANDARD"
            : "COLD_START_WILL_LEARN",
        mapping: proposals,
        duplicates: {
            autoInsert: dedupeReport.autoInsert.slice(0, 50),
            review: dedupeReport.review.slice(0, 200),
        },
    });
}
