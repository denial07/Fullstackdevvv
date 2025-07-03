// lib/models/Order.ts
import mongoose, { Schema, models, model } from "mongoose";

const OrderSchema = new Schema(
    {
        customer: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Paid", "Shipped", "Delivered"],
            default: "Pending",
        },
        value: {
            type: Number,
            required: true,
        },
        items: {
            type: [String], // list of item names or IDs
            default: [],
        },
        orderDate: {
            type: Date,
            default: Date.now,
        },
        deliveryDate: Date,
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

const Order = models.Order || model("Order", OrderSchema);
export default Order;
