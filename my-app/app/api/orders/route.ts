import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectToDatabase();
        const orders = await Order.find().lean();
        return NextResponse.json(JSON.parse(JSON.stringify(orders)));
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        await connectToDatabase();
        const newOrder = await Order.create(data);
        return NextResponse.json(JSON.parse(JSON.stringify(newOrder)), { status: 201 });
    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}