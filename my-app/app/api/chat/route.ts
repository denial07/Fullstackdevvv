// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Shipment from '@/lib/models/Shipment'
import Inventory from '@/lib/models/Inventory'

const GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent'

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json()
        const apiKey = process.env.GEMINI_API_KEY

        if (!message || !apiKey) {
            return NextResponse.json(
                { error: 'Missing user message or Gemini API key.' },
                { status: 400 }
            )
        }

        // 1. Connect to MongoDB
        await connectToDatabase()

        // 2. Fetch raw data
        const [shipments, inventory] = await Promise.all([
            Shipment.find({}).lean(),
            Inventory.find({}).lean(),
        ])

        // Sample the first 5 records for context
        const sampleShipments = shipments.slice(0, 5)
        const sampleInventory = inventory.slice(0, 5)

        // 3. Format context
        const context = `
📦 SHIPMENTS DATA:
${JSON.stringify(sampleShipments, null, 2)}

📦 INVENTORY DATA:
${JSON.stringify(sampleInventory, null, 2)}
`

        // 4. Construct Gemini prompt
        const prompt = `
You are a logistics assistant. Here is some sample shipment data:
${JSON.stringify(sampleShipments, null, 2)}

User question: ${message}

Answer in a friendly, concise way.
`

        // 5. Send to Gemini API
        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
            }),
        })

        const geminiData = await geminiRes.json()
        console.log('Gemini raw response:', JSON.stringify(geminiData, null, 2))
        const geminiReply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text

        if (!geminiReply) {
            return NextResponse.json(
                {
                    error: 'Gemini did not return a valid response.',
                },
                { status: 200 }
            )
        }

        // 6. Return success
        return NextResponse.json(
            {
                reply: geminiReply,
            },
            { status: 200 }
        )
    } catch (error: any) {
        console.error('API Error in /api/chat:', error)

        return NextResponse.json(
            {
                error: 'Failed to process request',
                details: error.message || 'An unknown error occurred.',
            },
            { status: 500 }
        )
    }
}
