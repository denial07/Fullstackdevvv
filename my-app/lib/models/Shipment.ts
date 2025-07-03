// lib/models/Shipment.ts
import mongoose, { Schema, models, model } from "mongoose";

const ShipmentSchema = new Schema({

    id: { type: String, required: true, unique: true },
    type: { type: String, enum: ["incoming", "outgoing"], required: true },
    vendor: String,
    description: String,
    status: { type: String, required: true },
    eta: Date,
    price: { type: Number, required: true },

    // Shared fields
    // Incoming shipment details
    
}, { timestamps: true }); // optional: adds createdAt & updatedAt

const Shipment = models.Shipment || model("Shipment", ShipmentSchema);
export default Shipment;
