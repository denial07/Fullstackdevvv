// lib/models/SchemaProfile.ts (excerpt)
import mongoose, { Schema } from "mongoose";

const FieldSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["string", "number", "integer", "date", "boolean"], default: "string" },
    aliases: { type: [String], default: [] },
}, { _id: false });

const SchemaProfileSchema = new Schema({
    entity: { type: String, required: true, index: true },  // store lowercased
    version: { type: Number, default: 1 },
    active: { type: Boolean, default: true, index: true },
    fields: { type: [FieldSchema], default: [] },
    createdAt: Date,
    updatedAt: Date,
}, { collection: "schemaprofiles" });

// ensure only ONE active per entity
SchemaProfileSchema.index(
    { entity: 1, active: 1 },
    { unique: true, partialFilterExpression: { active: true } }
);

export default mongoose.models.SchemaProfile
    || mongoose.model("SchemaProfile", SchemaProfileSchema);
