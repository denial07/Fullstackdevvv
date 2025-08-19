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
