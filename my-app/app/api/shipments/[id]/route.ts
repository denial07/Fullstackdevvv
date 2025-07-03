import { connectToDatabase } from "@/lib/mongodb"
import Shipment from "@/lib/models/Shipment" // assuming you have a Mongoose model

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await connectToDatabase()
        const shipment = await Shipment.findById(params.id)

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
    { params }: { params: { id: string } }
) {
    try {
        await connectToDatabase()
        const data = await req.json()

        const updated = await Shipment.findByIdAndUpdate(params.id, data, {
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
