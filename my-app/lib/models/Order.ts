import mongoose, { Schema, model, models, Document } from "mongoose";

export interface OrderDoc extends Document {
    id: string;
    customer: string;
    customerEmail: string;
    items: string;
    quantity: number;
    unitPrice: number;
    totalValue: number;
    orderDate: string;
    dueDate: string;
    paymentStatus: "Paid" | "Pending" | "Overdue";
    paymentDate?: string | null;
    shippingStatus: "Delivered" | "Processing" | "Preparing" | "Scheduled" | "On Hold" | "Pending";
    shippingDate?: string | null;
    deliveryDate?: string | null;
    priority: "High" | "Standard";
}

const OrderSchema = new Schema<OrderDoc>({
    id: { type: String, required: true, unique: true },
    customer: String,
    customerEmail: String,
    items: String,
    quantity: Number,
    unitPrice: Number,
    totalValue: Number,
    orderDate: String,
    dueDate: String,
    paymentStatus: { type: String, enum: ["Paid", "Pending", "Overdue"] },
    paymentDate: String,
    shippingStatus: {
        type: String,
        enum: ["Delivered", "Processing", "Preparing", "Scheduled", "On Hold", "Pending"]
    },
    shippingDate: String,
    deliveryDate: String,
    priority: { type: String, enum: ["High", "Standard"] },
}, { timestamps: true });

const Order = models.Order || model<OrderDoc>("Order", OrderSchema);
export default Order;