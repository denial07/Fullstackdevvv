import mongoose from "mongoose";

const FieldSchema = new mongoose.Schema({
    name: { type: String, required: true },     // canonical field name
    type: { type: String, required: true },     // "string" | "number" | "integer" | "date" | "boolean"
    aliases: { type: [String], default: [] },   // observed header aliases
});

const SchemaProfileSchema = new mongoose.Schema(
    {
        entity: { type: String, required: true }, // e.g., "Shipment"
        version: { type: Number, default: 1 },
        fields: { type: [FieldSchema], default: [] },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const SchemaProfile =
    mongoose.models.SchemaProfile ||
    mongoose.model("SchemaProfile", SchemaProfileSchema);

export default SchemaProfile;
