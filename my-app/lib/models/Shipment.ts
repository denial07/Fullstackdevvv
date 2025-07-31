import mongoose, { Schema, model, models, Document } from "mongoose";

export interface ShipmentDoc extends Document {
    // keep _id as ObjectId
    type: "incoming" | "outgoing";
    id: string;              // your own shipment number
    vendor?: string;
    customer?: string;
    description?: string;
    price: number;
    status: string;
    destination: string; // optional, for outgoing shipments
    eta?: Date;
    newEta?: Date;
    deliveredDate?: Date;
    shippingDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    // Email-specific metadata (optional)
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
        id: { type: String, required: true, unique: true },   // business ID
        type: { type: String, enum: ["incoming", "outgoing"], required: true },
        vendor: String,
        customer: String,
        description: String,
        price: { type: Number, required: true },
        status: { type: String, required: true },
        destination: { type: String, default: "warehouse-A" }, // default for outgoing shipment
        eta: Date,
        newEta: Date,
        deliveredDate: Date,
        shippingDate: Date,
        // Email-specific metadata for AI-analyzed shipments
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
            emailTimestamp: Date,
            originalType: String,
            items: [{
                name: String,
                quantity: Number,
                description: String,
                price: Number
            }],
            extractedPrice: Number
        }
    },
    { timestamps: true }
);

const Shipment = models.Shipment || model<ShipmentDoc>("Shipment", ShipmentSchema);
export default Shipment;

