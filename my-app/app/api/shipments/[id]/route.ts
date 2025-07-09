import { connectToDatabase } from "@/lib/mongodb"
import Shipment from "@/lib/models/Shipment"

export async function GET(
    req: Request,
    context: { params: { id: string } }
) {
    try {
        await connectToDatabase()
        const shipment = await Shipment.findById(context.params.id)

        if (!shipment) {
            return new Response(JSON.stringify({ error: "Shipment not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            })
        }

        return new Response(JSON.stringify(shipment), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })
    } catch (error) {
        console.error("Error in GET handler:", error)
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}

export async function PATCH(
    req: Request,
    context: { params: { id: string } }
) {
    try {
        await connectToDatabase()
        const data = await req.json()

        const updated = await Shipment.findByIdAndUpdate(context.params.id, data, {
            new: true,
            runValidators: true,
        })

        if (!updated) {
            return new Response("Shipment not found", { status: 404 })
        }

        return new Response(JSON.stringify(updated), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })
    } catch (error) {
        console.error("Error in PATCH handler:", error)
        return new Response("Internal Server Error", { status: 500 })
    }
}
export async function DELETE(
    req: Request,
    context: { params: { id: string } }
) {
    try {
        await connectToDatabase()
        const deleted = await Shipment.findByIdAndDelete(context.params.id)

        if (!deleted) {
            return new Response("Shipment not found", { status: 404 })
        }

        return new Response("Shipment deleted successfully", { status: 200 })
    } catch (error) {
        console.error("Error in DELETE handler:", error)
        return new Response("Internal Server Error", { status: 500 })
    }
}