// app/api/explore/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB || 'test';
const MAP: Record<'shipments' | 'inventory', string> = {
    shipments: process.env.SHIPMENTS_COL || 'shipments',
    inventory: process.env.INVENTORY_COL || 'inventories',
};

let client: MongoClient | null = null;
async function db() {
    if (!client) client = await new MongoClient(uri).connect();
    return client.db(DB_NAME);
}

export async function POST(req: Request) {
    const body = await req.json() as {
        dataset: 'shipments' | 'inventory';
        groupBy: string;
        agg: { op: 'count' | 'sum' | 'avg'; field?: string };
    };

    const database = await db();
    const col = database.collection(MAP[body.dataset]);

    // Special handling for inventory status - calculate dynamically
    if (body.dataset === 'inventory' && body.groupBy === 'status') {
        const items = await col.find({}).toArray();
        
        // Calculate status for each item using same logic as inventory page
        const statusCounts: Record<string, number> = {
            'Good': 0,
            'Low Stock': 0,
            'Expiring Soon': 0,
            'Expired': 0
        };

        const getDaysUntilExpiry = (expiryDate: string) => {
            const today = new Date()
            const expiry = new Date(expiryDate)
            const diffTime = expiry.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays
        }

        for (const item of items) {
            const stockPercentage = (item.quantity / item.maxStock) * 100
            const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
            
            // Priority order: Expired > Expiring Soon > Low Stock > Good
            if (daysToExpiry < 0) {
                statusCounts['Expired']++
            } else if (daysToExpiry < 30 && daysToExpiry >= 0) {
                statusCounts['Expiring Soon']++
            } else if (stockPercentage < 20) {
                statusCounts['Low Stock']++
            } else {
                statusCounts['Good']++
            }
        }

        // Convert to the expected format
        const rows = Object.entries(statusCounts)
            .map(([key, value]) => ({ key, value }))
            .filter(row => row.value > 0) // Only show statuses that have items
            .sort((a, b) => b.value - a.value);

        return NextResponse.json({ rows });
    }

    // Standard aggregation for other cases
    const acc =
        body.agg.op === 'count' ? { $sum: 1 } :
            body.agg.op === 'sum' ? { $sum: { $toDouble: { $ifNull: [`$${body.agg.field}`, 0] } } } :
                { $avg: { $toDouble: { $ifNull: [`$${body.agg.field}`, 0] } } };

    const rows = await col.aggregate([
        { $group: { _id: `$${body.groupBy}`, value: acc } },
        { $project: { _id: 0, key: { $ifNull: ['$_id', 'Unknown'] }, value: 1 } },
        { $sort: { value: -1 } },
        { $limit: 1000 }
    ]).toArray();

    return NextResponse.json({ rows });
}
