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

    return {
        totalItems: items.length,
        lowStock: items.filter(i => i.stock <= 5).length,
        expiringSoon: items.filter(i => i.expiresInDays > 0 && i.expiresInDays <= 30).length,
        expired: items.filter(i => i.expiresInDays <= 0).length,
        totalValue: items.reduce((sum, i) => sum + (i.stock * (i.price || 0)), 0),
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
