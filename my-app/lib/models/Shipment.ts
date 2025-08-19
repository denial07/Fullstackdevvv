// lib/models/Shipment.ts
import mongoose, { Schema, model, models, Document } from "mongoose";

export type ShipmentStatus = "In Transit" | "Delayed" | "Delivered";

function toDate(v: any) {
    if (v == null || v === "") return undefined;
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
}

export interface ShipmentDoc extends Document {
    type: "incoming" | "outgoing";
    id: string;                    // business ID
    vendor?: string;
    customer?: string;
    description?: string;
    price: number;
    status: ShipmentStatus;        // 🔒 enum
    destination: string;
    eta?: Date;
    newEta?: Date;
    deliveredDate?: Date;
    shippingDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    emailMetadata?: {
        emailId?: string;
        trackingNumber?: string;
        shipmentId?: string;
        carrier?: string;
        urgency?: string;
        actionRequired?: boolean;
        notes?: string;
        suggestedAction?: string;
        emailSubject?: string;
        emailFrom?: any;
        emailTimestamp?: Date;
        originalType?: string;
        items?: Array<{ name: string; quantity?: number; description?: string; price?: number }>;
        extractedPrice?: number;
    };
}

const ShipmentSchema = new Schema<ShipmentDoc>(
    {
        // Alias lets you read/write `shipmentId` but persist in `id`
        id: { type: String, required: true, unique: true, alias: "shipmentId" },
        type: { type: String, enum: ["incoming", "outgoing"], required: true },

        vendor: String,
        customer: String,
        description: String,

        price: { type: Number, required: true, default: 0 },

        // 🔒 only 3 allowed values
        status: {
            type: String,
            enum: ["In Transit", "Delayed", "Delivered"],
            default: "In Transit",
            required: true,
            index: true,
        },

        destination: { type: String, default: "warehouse-A" },

        // String → Date coercion (import-safe)
        eta: { type: Date, set: toDate },
        newEta: { type: Date, set: toDate },
        deliveredDate: { type: Date, set: toDate },
        shippingDate: { type: Date, set: toDate },

        emailMetadata: {
            emailId: String,
            trackingNumber: String,
            shipmentId: String,
            carrier: String,
            urgency: String,
            actionRequired: Boolean,
            notes: String,
            suggestedAction: String,
            emailSubject: String,
            emailFrom: Schema.Types.Mixed,
            emailTimestamp: { type: Date, set: toDate },
            originalType: String,
            items: [
                {
                    name: String,
                    quantity: Number,
                    description: String,
                    price: Number,
                },
            ],
            extractedPrice: Number,
        },
    },
    { timestamps: true, collection: "shipments" }
);

// Helpful virtuals
ShipmentSchema.virtual("isDelayed").get(function (this: ShipmentDoc) {
    return this.status === "Delayed";
});
ShipmentSchema.virtual("isDelivered").get(function (this: ShipmentDoc) {
    return this.status === "Delivered";
});

// (Optional) Safety: if some code writes an invalid status, normalize here or throw.
// We recommend normalizing *before* DB (your commit route already does that).
ShipmentSchema.pre("validate", function (next) {
    if (!this.status) this.status = "In Transit";
    next();
});

const Shipment =
    (models.Shipment as mongoose.Model<ShipmentDoc>) ||
    model<ShipmentDoc>("Shipment", ShipmentSchema);

export default Shipment;
