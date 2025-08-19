// /app/api/shipments/add-column/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Shipment from "@/lib/models/Shipment";
import SchemaProfile from "@/lib/models/SchemaProfile";
import { inferDataTypeWithGemini } from "@/lib/gemini";

// normalize headers to your canonical style
function normalizeHeader(h: string) {
    return String(h).toLowerCase().replace(/[\s_\-\/]+/g, " ").trim();
}

// map inferred type → default value to set on docs
function defaultFor(type: string) {
    switch (type) {
        case "number":
        case "integer":
            return 0;
        case "boolean":
            return false;
        case "date":
            return new Date().toISOString();
        case "string":
        default:
            return "";
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const rawColumnKey = body?.columnKey as string;
        const rawEntity = (body?.entity as string) ?? "Shipment";
        const explicitType = body?.type as string | undefined; // optional override

        if (!rawColumnKey || typeof rawColumnKey !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid columnKey" },
                { status: 400 }
            );
        }

        // normalize inputs
        const entity = rawEntity.trim().toLowerCase();
        const columnKey = normalizeHeader(rawColumnKey);

        await connectToDatabase();

        // infer type (allow explicit override)
        let inferredType =
            explicitType && ["string", "number", "integer", "date", "boolean"].includes(explicitType)
                ? explicitType
                : await (async () => {
                    try {
                        const t = await inferDataTypeWithGemini(columnKey);
                        return ["string", "number", "integer", "date", "boolean"].includes(t)
                            ? t
                            : "string";
                    } catch {
                        return "string";
                    }
                })();

        // default value to apply to existing docs
        const defaultValue = defaultFor(inferredType);

        // transaction for consistency (data + schema)
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1) update all shipments: add the new field
            await Shipment.updateMany(
                {},
                { $set: { [columnKey]: defaultValue } },
                { session }
            );

            // 2) upsert SchemaProfile (active) for this entity
            //    - create if missing
            //    - if exists, add field if not present, bump version
            let profile = await SchemaProfile.findOne({
                active: true,
                entity: { $regex: new RegExp(`^${entity}$`, "i") }, // case-insensitive match
            })
                .session(session)
                .exec();

            // field payload (store the normalized name; keep original as alias if different)
            const newField = {
                name: columnKey,
                type: inferredType as "string" | "number" | "integer" | "date" | "boolean",
                aliases:
                    normalizeHeader(rawColumnKey) !== columnKey
                        ? [normalizeHeader(rawColumnKey)]
                        : [],
            };

            if (!profile) {
                // create a brand-new active profile
                profile = await SchemaProfile.create(
                    [
                        {
                            entity, // always normalized going forward
                            version: 1,
                            active: true,
                            fields: [newField],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    ],
                    { session }
                ).then((docs) => docs[0]);
            } else {
                // check if field already exists (case-insensitive)
                const idx = (profile.fields ?? []).findIndex(
                    (f: any) => normalizeHeader(f?.name) === columnKey
                );

                if (idx === -1) {
                    // add new field
                    profile.fields.push(newField as any);
                } else {
                    // ensure alias present; upgrade type if existing is "string" and we found stronger
                    const f = profile.fields[idx] as any;
                    const aliasSet = new Set<string>(Array.isArray(f.aliases) ? f.aliases : []);
                    for (const a of newField.aliases) aliasSet.add(a);
                    f.aliases = Array.from(aliasSet);
                    if (f.type === "string" && newField.type !== "string") {
                        f.type = newField.type;
                    }
                    profile.fields[idx] = f;
                }

                // bump version and save
                profile.version = (profile.version ?? 1) + 1;
                (profile as any).updatedAt = new Date();
                await profile.save({ session });
            }

            await session.commitTransaction();
            session.endSession();

            return NextResponse.json({
                ok: true,
                entity,
                column: columnKey,
                type: inferredType,
                defaultApplied: defaultValue,
                profileVersion: profile.version,
                profileId: String(profile._id),
                message: `Column '${columnKey}' added to all shipments and schema profile updated.`,
            });
        } catch (e: any) {
            await session.abortTransaction();
            session.endSession();
            throw e;
        }
    } catch (error: any) {
        console.error("❌ add-column error:", error);
        return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
    }
}
