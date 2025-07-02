import mongoose from "mongoose";
import { config } from "dotenv";
import Shipment from "../lib/models/Shipment";

config(); // Load .env

async function seed() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("❌ MONGODB_URI is not defined in the environment.");
    }

    await mongoose.connect(uri);
    await Shipment.deleteMany(); // Reset

    await Shipment.insertMany([
        {
            id: "SH-IN-001",
            type: "incoming",
            vendor: "Malaysian Timber Co.",
            description: "Teak Wood - 50m³",
            status: "In Transit",
            eta: new Date("2024-01-15"),
            price: 15000,
        },
        {
            id: "SH-IN-002",
            type: "incoming",
            vendor: "Indonesian Wood Supply",
            description: "Pine Wood - 75m³",
            status: "Delayed",
            eta: new Date("2024-01-12"),
            price: 22000,
        },
        {
            id: "SH-IN-003",
            type: "incoming",
            vendor: "Thai Forest Products",
            description: "Oak Wood - 40m³",
            status: "Arrived",
            arrival: new Date("2024-01-08"),
            price: 18500,
        },
        {
            id: "SH-OUT-001",
            type: "outgoing",
            vendor: "ABC Logistics Pte Ltd",
            description: "Standard Pallets x 500",
            status: "Delivered",
            arrival: new Date("2024-01-10"),
            price: 12500,
        },
        {
            id: "SH-OUT-002",
            type: "outgoing",
            vendor: "Singapore Shipping Co.",
            description: "Heavy Duty Pallets x 200",
            status: "In Transit",
            eta: new Date("2024-01-14"),
            price: 8900,
        },
        {
            id: "SH-OUT-003",
            type: "outgoing",
            vendor: "Maritime Solutions Ltd",
            description: "Custom Pallets x 150",
            status: "Preparing",
            eta: new Date("2024-01-16"),
            price: 6750,
        },
    ]);

    console.log("✅ Shipments seeded!");
    await mongoose.disconnect();
}

seed();
