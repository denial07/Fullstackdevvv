// lib/models/ImportSessions.ts
import mongoose, { Schema, Model } from "mongoose";

export type ImportSessionStatus = "DRY_RUN" | "COMMITTED" | "FAILED";

export interface ImportSessionAttrs {
    entity: string;                 // e.g., "Shipment"
    fileHash: string;               // sha256 of file bytes
    stats?: Record<string, any>;    // counts, headers, etc.
    decisions?: Record<string, any>; // mapping + duplicate decisions + flags
    status?: ImportSessionStatus;
}

export interface ImportSessionDoc
    extends mongoose.Document,
    ImportSessionAttrs {
    createdAt: Date;
    updatedAt: Date;
}

const ImportSessionSchema = new Schema<ImportSessionDoc>(
    {
        entity: { type: String, required: true },
        fileHash: { type: String, required: true }, // NOTE: no 'unique' here
        stats: { type: Schema.Types.Mixed },
        decisions: { type: Schema.Types.Mixed },
        status: {
            type: String,
            enum: ["DRY_RUN", "COMMITTED", "FAILED"],
            default: "DRY_RUN",
        },
    },
    {
        timestamps: true,
        collection: "importsessions", // keep a predictable collection name
    }
);

// Unique per (entity, fileHash)
ImportSessionSchema.index({ entity: 1, fileHash: 1 }, { unique: true });

const ImportSession: Model<ImportSessionDoc> =
    (mongoose.models.ImportSession as Model<ImportSessionDoc>) ||
    mongoose.model<ImportSessionDoc>("ImportSession", ImportSessionSchema);

export default ImportSession;
