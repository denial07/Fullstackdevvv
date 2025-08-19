import { connectToDatabase } from "./mongodb";
import Shipment from "./models/Shipment";
import Inventory from "./models/Inventory";
import Order from "./models/Order";

// Types
export type ShipmentSummary = {
    total: number;
    inTransit: number;
    preparing: number;
    arrived: number;
    delayed: number;
    totalValue: number;
};

export type InventorySummary = {
    totalItems: number;
    lowStock: number;
    expiringSoon: number;
    expired: number;
    totalValue: number;
};

export type OrdersSummary = {
    total: number;
    pending: number;
    paid: number;
    shipped: number;
    delivered: number;
    totalValue: number;
};

// Shipment summary
export async function getShipmentSummary(): Promise<ShipmentSummary> {
    await connectToDatabase();
    const shipments = await Shipment.find({ type: "outgoing" }).lean();

    return {
        total: shipments.length,
        inTransit: shipments.filter(s => ["In Transit", "Loading"].includes(s.status)).length,
        preparing: shipments.filter(s => ["Preparing", "Scheduled"].includes(s.status)).length,
        arrived: shipments.filter(s => s.status === "Delivered").length,
        delayed: shipments.filter(s => s.status === "Delayed").length,
        totalValue: shipments.reduce((sum, s) => sum + (s.price || 0), 0),
    };
}

// Inventory summary
export async function getInventorySummary(): Promise<InventorySummary> {
    await connectToDatabase();
    const items = await Inventory.find({}).lean();

    // Helper function to calculate days until expiry
    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date()
        const expiry = new Date(expiryDate)
        const diffTime = expiry.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    // Calculate metrics using the same logic as inventory page
    const lowStock = items.filter(item => {
        const stockPercentage = (item.quantity / item.maxStock) * 100
        return stockPercentage < 20
    }).length

    const expiringSoon = items.filter(item => {
        const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
        return daysToExpiry < 30 && daysToExpiry >= 0
    }).length

    const expired = items.filter(item => {
        const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
        return daysToExpiry < 0
    }).length

    const totalValue = items.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0)

    return {
        totalItems: items.length,
        lowStock,
        expiringSoon,
        expired,
        totalValue,
    };
}

// Orders summary
export async function getOrdersSummary(): Promise<OrdersSummary> {
    await connectToDatabase();
    const orders = await Order.find({}).lean();

    return {
        total: orders.length,
        pending: orders.filter(o => o.status === "Pending").length,
        paid: orders.filter(o => o.status === "Paid").length,
        shipped: orders.filter(o => o.status === "Shipped").length,
        delivered: orders.filter(o => o.status === "Delivered").length,
        totalValue: orders.reduce((sum, o) => sum + (o.value || 0), 0),
    };
}
