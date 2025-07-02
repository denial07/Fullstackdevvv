// lib/models/Shipment.ts
import mongoose, { Schema, models, model } from "mongoose";

const ShipmentSchema = new Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, enum: ["incoming", "outgoing"], required: true },

    // Shared fields
    status: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    trackingNumber: String,

    // Incoming shipment details
    vendor: String,
    eta: Date,
    arrival: Date,

    // Outgoing shipment details
    customer: String,
    orderDate: Date,
    shippingDate: Date,
    deliveryDate: Date,
    driver: String,
    vehicle: String,
    address: String,
}, { timestamps: true }); // optional: adds createdAt & updatedAt

const Shipment = models.Shipment || model("Shipment", ShipmentSchema);
export default Shipment;
