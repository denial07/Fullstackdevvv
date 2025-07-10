import mongoose, { Schema, model, models, Document } from "mongoose";

export interface ShipmentDoc extends Document {
    _id: string;
    type: "incoming" | "outgoing";
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
        _id: { type: String, required: true, unique: true },
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
