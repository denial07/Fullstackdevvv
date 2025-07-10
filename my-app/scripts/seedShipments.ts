import mongoose from "mongoose";
import { config } from "dotenv";
import Shipment from "../lib/models/Shipment";
import { de } from "date-fns/locale";

config(); // Load .env.local

async function seed() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("❌ MONGODB_URI is not defined in the environment.");
    }

    await mongoose.connect(uri);
    await Shipment.deleteMany(); // Clear existing records

    await Shipment.insertMany([
        // Incoming Shipments
        {
            id: "SH-IN-001",
            type: "incoming",
            vendor: "Malaysian Timber Co.",
            description: "Teak Wood - 50m³",
            status: "In Transit", // Displayed, actual status is determined in UI
            destination: "warehouse-A",
            eta: new Date("2025-07-12"),
            price: 15000,
        },
        {
            id: "SH-IN-002",
            type: "incoming",
            vendor: "Indonesian Wood Supply",
            description: "Pine Wood - 75m³",
            status: "Delayed",
            destination: "warehouse-B",
            eta: new Date("2025-07-05"), // Original ETA passed
            newEta: new Date("2025-07-15"), // Delayed
            price: 22000,
        },
        {
            id: "SH-IN-003",
            type: "incoming",
            vendor: "Thai Forest Products",
            description: "Oak Wood - 40m³",
            status: "Delivered",
            destination: "warehouse-C",
            eta: new Date("2025-07-01"),
            deliveredDate: new Date("2025-07-07"),
            price: 18500,
        },

        // Outgoing Shipments
        {
            id: "SH-OUT-001",
            type: "outgoing",
            customer: "ABC Logistics Pte Ltd",
            description: "Standard Pallets x 500",
            status: "Delivered",
            destination: "Spain",
            shippingDate: new Date("2025-07-06"),
            price: 12500,
        },
        {
            id: "SH-OUT-002",
            type: "outgoing",
            customer: "Singapore Shipping Co.",
            description: "Heavy Duty Pallets x 200",
            status: "In Transit",
            destination: "Germany",
            shippingDate: new Date("2025-07-12"),
            price: 8900,
        },
        {
            id: "SH-OUT-003",
            type: "outgoing",
            customer: "Maritime Solutions Ltd",
            description: "Custom Pallets x 150",
            status: "Preparing",
            destination: "Australia",
            shippingDate: new Date("2025-07-14"),
            price: 6750,
        },
    ]);

    console.log("✅ Shipments seeded!");
    await mongoose.disconnect();
}

seed();
