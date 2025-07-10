import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const order = await Order.findOne({ id: params.id }).lean();
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
        return NextResponse.json(JSON.parse(JSON.stringify(order)));
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const data = await req.json();
        await connectToDatabase();
        const updated = await Order.findOneAndUpdate({ id: params.id }, data, {
            new: true,
            runValidators: true,
        }).lean();
        if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
        return NextResponse.json(JSON.parse(JSON.stringify(updated)));
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const deleted = await Order.findOneAndDelete({ id: params.id });
        if (!deleted) return NextResponse.json({ error: "Order not found" }, { status: 404 });
        return NextResponse.json({ message: "Order deleted" });
    } catch (error) {
        console.error("Error deleting order:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
