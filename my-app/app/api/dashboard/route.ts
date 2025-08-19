// app/api/dashboard/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB || 'test';      // <— defaults to "test"
const SHIP_COL = process.env.SHIPMENTS_COL || 'shipments';
const INV_COL = process.env.INVENTORY_COL || 'inventories';

let client: MongoClient | null = null;
async function db(): Promise<Db> {
    if (!client) client = await new MongoClient(uri).connect();
    return client.db(DB_NAME);
}

type PeriodKey = '7d' | '30d' | '90d';
const PERIOD_DAYS: Record<PeriodKey, number> = { '7d': 7, '30d': 30, '90d': 90 };

export async function GET(req: Request) {
    const url = new URL(req.url);
    const period = (url.searchParams.get('period') as PeriodKey) || '30d';
    const days = PERIOD_DAYS[period] ?? 30;

    const database = await db();
    const shipments = database.collection(SHIP_COL);
    const inventory = database.collection(INV_COL);

    const now = new Date();
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Normalise date fields that might be stored as strings
    const addShipDates = {
        $addFields: {
            shipAt: {
                $cond: [
                    { $eq: [{ $type: '$shipDate' }, 'date'] },
                    '$shipDate',
                    { $dateFromString: { dateString: '$shipDate', onError: null, onNull: null } }
                ]
            },
            estAt: {
                $cond: [
                    { $eq: [{ $type: '$estimatedDelivery' }, 'date'] },
                    '$estimatedDelivery',
                    { $dateFromString: { dateString: '$estimatedDelivery', onError: null, onNull: null } }
                ]
            },
            delivAt: {
                $cond: [
                    { $eq: [{ $type: '$deliveredDate' }, 'date'] },
                    '$deliveredDate',
                    { $dateFromString: { dateString: '$deliveredDate', onError: null, onNull: null } }
                ]
            }
        }
    };

    // ---- Shipment summary (arrived / in-transit / delayed + total value)
    const shipmentAgg = await shipments.aggregate([
        addShipDates,
        { $match: { shipAt: { $gte: from } } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: { $ifNull: ['$valueSGD', 0] } }
            }
        }
    ]).toArray();

    const by = (status: string) => shipmentAgg.find(x => x._id === status)?.count ?? 0;
    const shipmentSummary = {
        total: shipmentAgg.reduce((a, b) => a + (b.count ?? 0), 0),
        inTransit: by('In Transit'),
        delayed: by('Delayed'),
        arrived: by('Delivered'),
        totalValue: shipmentAgg.reduce((a, b) => a + (b.totalValue ?? 0), 0)
    };

    // ---- Inventory summary (low stock / expiring / expired / value)
    const inventoryItems = await inventory.find({}).toArray();
    
    // Calculate inventory metrics using the same logic as inventory page
    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date()
        const expiry = new Date(expiryDate)
        const diffTime = expiry.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    let lowStock = 0, expiringSoon = 0, expired = 0, totalValue = 0;

    for (const item of inventoryItems) {
        // Calculate stock percentage and days to expiry
        const stockPercentage = (item.quantity / item.maxStock) * 100
        const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
        
        // Count items by status (same logic as inventory page)
        if (daysToExpiry < 0) {
            expired++
        } else if (daysToExpiry < 30 && daysToExpiry >= 0) {
            expiringSoon++
        } else if (stockPercentage < 20) {
            lowStock++
        }
        
        // Calculate total value
        totalValue += (item.quantity * item.costPerUnit)
    }

    const inventorySummary = {
        totalItems: inventoryItems.length,
        lowStock,
        expiringSoon, 
        expired,
        totalValue
    };

    // ---- Inventory value distribution (by category)
    const inventoryValueDist = await inventory.aggregate([
        {
            $addFields: {
                value: { $multiply: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$costPerUnit', 0] }] }
            }
        },
        { $group: { _id: '$category', value: { $sum: '$value' } } },
        { $project: { _id: 0, name: '$_id', value: 1 } },
        { $sort: { value: -1 } },
        { $limit: 12 }
    ]).toArray();

    // ---- Shipment trends (week bucket)
    const shipmentTrends = await shipments.aggregate([
        addShipDates,
        { $match: { shipAt: { $gte: from } } },
        {
            $addFields: {
                weekStart: { $dateTrunc: { date: '$shipAt', unit: 'week', timezone: 'UTC' } },
                isIncoming: { $eq: ['$Type', 'Incoming'] },
                isInternal: { $eq: ['$Type', 'Internal'] },
                isDelayed: { $or: [{ $eq: ['$status', 'Delayed'] }, { $gt: ['$delayDays', 0] }] }
            }
        },
        {
            $group: {
                _id: '$weekStart',
                incoming: { $sum: { $cond: ['$isIncoming', 1, 0] } },
                outgoing: { $sum: { $cond: ['$isOutgoing', 1, 0] } },
                delayed: { $sum: { $cond: ['$isDelayed', 1, 0] } }
            }
        },
        {
            $project: {
                _id: 0,
                week: { $dateToString: { date: '$_id', format: '%Y-%m-%d' } },
                incoming: 1, outgoing: 1, delayed: 1
            }
        },
        { $sort: { week: 1 } }
    ]).toArray();

    // ---- Daily operations (by day-of-week)
    const dowAgg = await shipments.aggregate([
        addShipDates,
        { $match: { shipAt: { $gte: from } } },
        { $group: { _id: { $dayOfWeek: '$shipAt' }, shipments: { $sum: 1 } } }
    ]).toArray();
    const dowName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const map = new Map<number, number>();
    for (const r of dowAgg) map.set(r._id, r.shipments);
    const dailyOps = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(name => {
        const idx = dowName.indexOf(name) + 1; // 1=Sun..7=Sat
        return { day: name, shipments: map.get(idx) ?? 0, inventory: Math.round((inventorySummary.lowStock + inventorySummary.expiringSoon) / 7) };
    });

    // ---- Recent shipments (latest 12)
    const recentDocs = await shipments.aggregate([
        addShipDates,
        { $sort: { shipAt: -1 } },
        { $limit: 12 },
        {
            $project: {
                _id: 0,
                id: { $ifNull: ['$shipmentId', '$trackingNumber'] },
                vendor: { $ifNull: ['$vendor', 'Unknown'] },
                status: { $ifNull: ['$status', 'In Transit'] },
                expectedArrival: { $ifNull: ['$estAt', '$expectedArrival'] },
                value: { $ifNull: ['$valueSGD', '$declaredValue'] },
                delay: { $ifNull: ['$delayDays', 0] }
            }
        }
    ]).toArray();

    // ---- Critical inventory (top 12)
    const criticalInventory = await inventory.aggregate([
        {
            $addFields: {
                expiryAt: {
                    $cond: [
                        { $eq: [{ $type: '$expiryDate' }, 'date'] },
                        '$expiryDate',
                        { $dateFromString: { dateString: '$expiryDate', onError: null, onNull: null } }
                    ]
                },
                stockPercentage: { 
                    $cond: [
                        { $gt: ['$maxStock', 0] },
                        { $multiply: [{ $divide: ['$quantity', '$maxStock'] }, 100] },
                        0
                    ]
                }
            }
        },
        {
            $addFields: {
                daysToExpiry: {
                    $cond: [
                        { $ne: ['$expiryAt', null] },
                        { $divide: [{ $subtract: ['$expiryAt', now] }, 86400000] }, // Convert to days
                        999999 // Large number for items without expiry
                    ]
                }
            }
        },
        {
            $match: {
                $or: [
                    { daysToExpiry: { $lt: 30 } }, // Expiring within 30 days or expired
                    { stockPercentage: { $lt: 20 } } // Low stock (< 20%)
                ]
            }
        },
        {
            $project: {
                _id: 0,
                id: { $ifNull: ['$id', ''] },
                item: '$item',
                quantity: 1,
                unit: '$unit',
                expiryDate: '$expiryDate',
                status: {
                    $cond: [
                        { $lt: ['$daysToExpiry', 0] }, 'Expired',
                        {
                            $cond: [
                                { $and: [{ $gte: ['$daysToExpiry', 0] }, { $lt: ['$daysToExpiry', 30] }] },
                                'Expiring Soon',
                                { $cond: [{ $lt: ['$stockPercentage', 20] }, 'Low Stock', 'Normal'] }
                            ]
                        }
                    ]
                }
            }
        },
        { $limit: 12 }
    ]).toArray();

    return NextResponse.json({
        shipmentSummary,
        inventorySummary,
        shipmentTrends,
        inventoryValueDist,
        dailyOps,
        recentShipments: recentDocs,
        criticalInventory
    });
}
