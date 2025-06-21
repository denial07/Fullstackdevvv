import mongoose, { Schema, models, model } from "mongoose";

const ShipmentSchema = new Schema({
    id: String,
    type: { type: String, enum: ["incoming", "outgoing"] },
    vendor: String,
    description: String,
    status: String,
    eta: Date,
    arrival: Date,
    price: Number,
});

const Shipment = models.Shipment || model("Shipment", ShipmentSchema);
export default Shipment;
