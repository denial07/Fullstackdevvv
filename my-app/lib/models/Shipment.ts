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
    eta?: Date;
    newEta?: Date;
    deliveredDate?: Date;
    shippingDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
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
        eta: Date,
        newEta: Date,
        deliveredDate: Date,
        shippingDate: Date,
    },
    { timestamps: true }
);

const Shipment = models.Shipment || model<ShipmentDoc>("Shipment", ShipmentSchema);
export default Shipment;

