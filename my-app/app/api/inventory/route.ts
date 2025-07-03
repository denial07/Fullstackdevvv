import { connectToDatabase } from "@/lib/mongodb"
import Shipment from "@/lib/models/Shipment"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  await connectToDatabase()
  const { id } = context.params 
  const shipment = await Shipment.findById(id)
  if (!shipment) return new Response("Not found", { status: 404 })
  return Response.json(shipment)
}


export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  await connectToDatabase()
  const body = await req.json()
  const { id } = context.params
  const updated = await Shipment.findByIdAndUpdate(id, body, { new: true })
  return Response.json(updated)
}
