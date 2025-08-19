// app/api/dashboard/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB || 'test';
const SHIP_COL = process.env.SHIPMENTS_COL || 'shipments';
const INV_COL = process.env.INVENTORY_COL || 'inventories';

let client: MongoClient | null = null;
async function db(): Promise<Db> {
    if (!client) client = await new MongoClient(uri).connect();
    return client.db(DB_NAME);
}

type PeriodKey = '7d' | '30d' | '90d';
const PERIOD_DAYS: Record<PeriodKey, number> = { '7d': 7, '30d': 30, '90d': 90 };

// Helpers to build “coalesce + parse” date expressions
const dateOrParse = (field: string) => ({
    $cond: [
        { $eq: [{ $type: `$${field}` }, 'date'] },
        `$${field}`,
        { $dateFromString: { dateString: `$${field}`, onError: null, onNull: null } },
    ],
});

// $ifNull chain builder
const coalesce = (...exprs: any[]) =>
    exprs.reduceRight((acc, e) => ({ $ifNull: [e, acc] }), null);

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

    // Normalize commonly-used shipment dates and status
    const addShipDatesAndStatus = {
        $addFields: {
            shipAt: coalesce(
                dateOrParse('shippingDate'),
                dateOrParse('shipDate'),
                dateOrParse('createdAt')
            ),
            estAt: coalesce(
                dateOrParse('estimatedDelivery'),
                dateOrParse('newEta'),
                dateOrParse('eta'),
                dateOrParse('expectedArrival')
            ),
            delivAt: coalesce(
                dateOrParse('deliveredDate'),
                dateOrParse('deliveryDate')
            ),
            // statusNorm: lower+trim for consistent matching
            statusNorm: {
                $trim: { input: { $toLower: { $ifNull: ['$status', ''] } } },
            },
            valueNorm: { $ifNull: ['$valueSGD', { $ifNull: ['$declaredValue', { $ifNull: ['$price', 0] }] }] },
        },
    };

    // Unified activity date for filtering & trends: prefer shipAt, then estAt, then delivAt
    const addActiveAt = {
        $addFields: {
            activeAt: coalesce('$shipAt', '$estAt', '$delivAt'),
        },
    };

    // ---- Shipment summary (total / in-transit / delayed / arrived + total value)
    const summaryAgg = await shipments
        .aggregate([
            addShipDatesAndStatus,
            addActiveAt,
            {
                $match: {
                    $or: [
                        { shipAt: { $gte: from } },
                        { estAt: { $gte: from } },
                        { delivAt: { $gte: from } },
                        // as a fallback, also accept unified date if present
                        { activeAt: { $gte: from } },
                    ],
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    inTransit: {
                        $sum: {
                            $cond: [{ $in: ['$statusNorm', ['in transit', 'transit']] }, 1, 0],
                        },
                    },
                    delayed: {
                        $sum: {
                            $cond: [
                                { $or: [{ $eq: ['$statusNorm', 'delayed'] }, { $gt: ['$delayDays', 0] }] },
                                1,
                                0,
                            ],
                        },
                    },
                    arrived: {
                        $sum: {
                            $cond: [{ $in: ['$statusNorm', ['arrived', 'delivered']] }, 1, 0],
                        },
                    },
                    totalValue: { $sum: '$valueNorm' },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    inTransit: 1,
                    delayed: 1,
                    arrived: 1,
                    totalValue: 1,
                },
            },
        ])
        .toArray();

    const shipmentSummary =
        summaryAgg[0] ?? { total: 0, inTransit: 0, delayed: 0, arrived: 0, totalValue: 0 };

    // ---- Inventory summary (low stock / expiring / expired / value)
    const inventoryItems = await inventory.find({}).toArray();

    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    let lowStock = 0,
        expiringSoon = 0,
        expired = 0,
        totalValue = 0;

    for (const item of inventoryItems) {
        const stockPercentage =
            item.maxStock > 0 ? (item.quantity / item.maxStock) * 100 : 0;
        const daysToExpiry = item.expiryDate ? getDaysUntilExpiry(item.expiryDate) : 999999;

        if (daysToExpiry < 0) expired++;
        else if (daysToExpiry < 30) expiringSoon++;
        else if (stockPercentage < 20) lowStock++;

        totalValue += (Number(item.quantity) || 0) * (Number(item.costPerUnit) || 0);
    }

    const inventorySummary = {
        totalItems: inventoryItems.length,
        lowStock,
        expiringSoon,
        expired,
        totalValue,
    };

    // ---- Inventory value distribution (by category)
    const inventoryValueDist = await inventory
        .aggregate([
            {
                $addFields: {
                    value: {
                        $multiply: [
                            { $ifNull: ['$quantity', 0] },
                            { $ifNull: ['$costPerUnit', 0] },
                        ],
                    },
                },
            },
            { $group: { _id: '$category', value: { $sum: '$value' } } },
            { $project: { _id: 0, name: '$_id', value: 1 } },
            { $sort: { value: -1 } },
            { $limit: 12 },
        ])
        .toArray();

    // ---- Shipment trends (weekly, by status buckets)
    const shipmentTrends = await shipments
        .aggregate([
            addShipDatesAndStatus,
            addActiveAt,
            { $match: { activeAt: { $gte: from } } },
            {
                $addFields: {
                    weekStart: {
                        $dateTrunc: { date: '$activeAt', unit: 'week', timezone: 'UTC' },
                    },
                },
            },
            {
                $group: {
                    _id: '$weekStart',
                    inTransit: {
                        $sum: {
                            $cond: [{ $in: ['$statusNorm', ['in transit', 'transit']] }, 1, 0],
                        },
                    },
                    arrived: {
                        $sum: {
                            $cond: [{ $in: ['$statusNorm', ['arrived', 'delivered']] }, 1, 0],
                        },
                    },
                    delayed: {
                        $sum: {
                            $cond: [
                                { $or: [{ $eq: ['$statusNorm', 'delayed'] }, { $gt: ['$delayDays', 0] }] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    week: { $dateToString: { date: '$_id', format: '%Y-%m-%d' } },
                    inTransit: 1,
                    arrived: 1,
                    delayed: 1,
                },
            },
            { $sort: { week: 1 } },
        ])
        .toArray();

    // ---- Daily operations (by day-of-week) – use activeAt
    const dowAgg = await shipments
        .aggregate([
            addShipDatesAndStatus,
            addActiveAt,
            { $match: { activeAt: { $gte: from } } },
            { $group: { _id: { $dayOfWeek: '$activeAt' }, shipments: { $sum: 1 } } },
        ])
        .toArray();

    const dowName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const map = new Map<number, number>();
    for (const r of dowAgg) map.set(r._id, r.shipments);
    const dailyOps = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
        (name) => {
            const idx = dowName.indexOf(name) + 1; // 1=Sun..7=Sat
            return {
                day: name,
                shipments: map.get(idx) ?? 0,
                inventory: Math.round((inventorySummary.lowStock + inventorySummary.expiringSoon) / 7),
            };
        }
    );

    // ---- Recent shipments (latest 12) – normalize status to UI's union
    const recentDocs = await shipments
        .aggregate([
            addShipDatesAndStatus,
            {
                $addFields: {
                    statusUi: {
                        $switch: {
                            branches: [
                                { case: { $in: ['$statusNorm', ['arrived', 'delivered']] }, then: 'Arrived' },
                                { case: { $eq: ['$statusNorm', 'delayed'] }, then: 'Delayed' },
                                { case: { $in: ['$statusNorm', ['in transit', 'transit']] }, then: 'In Transit' },
                            ],
                            default: 'In Transit',
                        },
                    },
                },
            },
            { $sort: { shipAt: -1, estAt: -1, delivAt: -1, _id: -1 } },
            { $limit: 12 },
            {
                $project: {
                    _id: 0,
                    id: { $ifNull: ['$shipmentId', { $ifNull: ['$trackingNumber', ''] }] },
                    vendor: { $ifNull: ['$vendor', 'Unknown'] },
                    status: '$statusUi',
                    expectedArrival: { $ifNull: ['$estAt', '$expectedArrival'] },
                    value: '$valueNorm',
                    delay: { $ifNull: ['$delayDays', 0] },
                },
            },
        ])
        .toArray();

    // ---- Critical inventory (top 12) – unchanged except for safety tweaks
    const criticalInventory = await inventory
        .aggregate([
            {
                $addFields: {
                    expiryAt: coalesce(
                        dateOrParse('expiryDate'),
                        dateOrParse('expirationDate')
                    ),
                    stockPercentage: {
                        $cond: [
                            { $gt: ['$maxStock', 0] },
                            { $multiply: [{ $divide: ['$quantity', '$maxStock'] }, 100] },
                            0,
                        ],
                    },
                },
            },
            {
                $addFields: {
                    daysToExpiry: {
                        $cond: [
                            { $ne: ['$expiryAt', null] },
                            { $divide: [{ $subtract: ['$expiryAt', now] }, 86400000] },
                            999999,
                        ],
                    },
                },
            },
            {
                $match: {
                    $or: [{ daysToExpiry: { $lt: 30 } }, { stockPercentage: { $lt: 20 } }],
                },
            },
            {
                $project: {
                    _id: 0,
                    id: { $ifNull: ['$id', ''] },
                    item: '$item',
                    quantity: 1,
                    unit: 1,
                    expiryDate: '$expiryDate',
                    status: {
                        $cond: [
                            { $lt: ['$daysToExpiry', 0] },
                            'Expired',
                            {
                                $cond: [
                                    { $and: [{ $gte: ['$daysToExpiry', 0] }, { $lt: ['$daysToExpiry', 30] }] },
                                    'Expiring Soon',
                                    { $cond: [{ $lt: ['$stockPercentage', 20] }, 'Low Stock', 'Normal'] },
                                ],
                            },
                        ],
                    },
                },
            },
            { $limit: 12 },
        ])
        .toArray();

    return NextResponse.json({
        shipmentSummary,
        inventorySummary,
        shipmentTrends,
        inventoryValueDist,
        dailyOps,
        recentShipments: recentDocs,
        criticalInventory,
    });
}
