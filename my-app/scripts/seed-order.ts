import mongoose from "mongoose";
import { config } from "dotenv";
import Order from "../lib/models/Order";

config(); // Load MONGODB_URI from .env.local

async function seedOrders() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("❌ MONGODB_URI is not defined in the environment.");
    }

    await mongoose.connect(uri);
    await Order.deleteMany(); // Clear existing orders

    await Order.insertMany([
        {
            id: "ORD-001",
            customer: "ABC Logistics Pte Ltd",
            customerEmail: "orders@abclogistics.sg",
            items: "Standard Pallets x 500",
            quantity: 500,
            unitPrice: 25,
            totalValue: 12500,
            orderDate: "2024-01-08",
            dueDate: "2024-01-15",
            paymentStatus: "Paid",
            paymentDate: "2024-01-09",
            shippingStatus: "Delivered",
            shippingDate: "2024-01-10",
            deliveryDate: "2024-01-10",
            priority: "Standard",
        },
        {
            id: "ORD-002",
            customer: "Singapore Shipping Co.",
            customerEmail: "procurement@sgshipping.com",
            items: "Heavy Duty Pallets x 200",
            quantity: 200,
            unitPrice: 44.5,
            totalValue: 8900,
            orderDate: "2024-01-10",
            dueDate: "2024-01-17",
            paymentStatus: "Pending",
            paymentDate: null,
            shippingStatus: "Processing",
            shippingDate: null,
            deliveryDate: null,
            priority: "High",
        },
        {
            id: "ORD-003",
            customer: "Maritime Solutions Ltd",
            customerEmail: "orders@maritime-sol.sg",
            items: "Custom Pallets x 150",
            quantity: 150,
            unitPrice: 45,
            totalValue: 6750,
            orderDate: "2024-01-12",
            dueDate: "2024-01-19",
            paymentStatus: "Paid",
            paymentDate: "2024-01-12",
            shippingStatus: "Preparing",
            shippingDate: "2024-01-16",
            deliveryDate: null,
            priority: "Standard",
        },
        {
            id: "ORD-005",
            customer: "Port Authority Singapore",
            customerEmail: "procurement@portauth.sg",
            items: "Industrial Pallets x 600",
            quantity: 600,
            unitPrice: 36.67,
            totalValue: 22000,
            orderDate: "2024-01-11",
            dueDate: "2024-01-18",
            paymentStatus: "Overdue",
            paymentDate: null,
            shippingStatus: "On Hold",
            shippingDate: null,
            deliveryDate: null,
            priority: "High",
        },
        {
            id: "ORD-006",
            customer: "Warehouse Solutions Pte",
            customerEmail: "orders@warehouse-sol.sg",
            items: "Standard Pallets x 300",
            quantity: 300,
            unitPrice: 25,
            totalValue: 7500,
            orderDate: "2024-01-14",
            dueDate: "2024-01-21",
            paymentStatus: "Pending",
            paymentDate: null,
            shippingStatus: "Pending",
            shippingDate: null,
            deliveryDate: null,
            priority: "Standard",
        },
    ]);

    console.log("✅ Orders seeded successfully.");
    await mongoose.disconnect();
}

seedOrders().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
