import mongoose from "mongoose";

const ImportSessionSchema = new mongoose.Schema(
    {
        entity: { type: String, required: true }, // e.g., "Shipment"
        fileHash: { type: String, unique: true },
        stats: { type: mongoose.Schema.Types.Mixed },      // counts, headers, etc.
        decisions: { type: mongoose.Schema.Types.Mixed },  // mapping + duplicate decisions
        status: {
            type: String,
            enum: ["DRY_RUN", "COMMITTED", "FAILED"],
            default: "DRY_RUN",
        },
    },
    { timestamps: true }
);

// default export (matches your Shipment default export style)
const ImportSession =
    mongoose.models.ImportSession ||
    mongoose.model("ImportSession", ImportSessionSchema);

export default ImportSession;
