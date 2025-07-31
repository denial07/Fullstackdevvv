// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server"
import {
    getShipmentSummary,
    getInventorySummary,
    getOrdersSummary,
} from "@/lib/summaries"

const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent"

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json()
        const apiKey = process.env.GEMINI_API_KEY

        if (!message || !apiKey) {
            return NextResponse.json(
                { error: "Missing message or API key" },
                { status: 400 }
            )
        }

        // Fetch summaries from MongoDB
        const [shipments, inventory, orders] = await Promise.all([
            getShipmentSummary(),
            getInventorySummary(),
            getOrdersSummary(),
        ])

        // Construct context from DB
        const context = `
📦 SHIPMENT SUMMARY
- Total Shipments: ${shipments.total}
- In Transit: ${shipments.inTransit}
- Preparing: ${shipments.preparing}
- Delivered: ${shipments.arrived}
- Delayed: ${shipments.delayed}
- Total Shipment Value: $${shipments.totalValue.toLocaleString()}

📦 INVENTORY SUMMARY
- Total Inventory Items: ${inventory.totalItems}
- Low Stock Items: ${inventory.lowStock}
- Expiring Soon: ${inventory.expiringSoon}
- Expired Items: ${inventory.expired}
- Total Inventory Value: $${inventory.totalValue.toLocaleString()}

📦 ORDER SUMMARY
- Total Orders: ${orders.total}
- Pending: ${orders.pending}
- Paid: ${orders.paid}
- Shipped: ${orders.shipped}
- Delivered: ${orders.delivered}
- Total Order Value: $${orders.totalValue.toLocaleString()}
`

        // Construct smart assistant prompt
        const prompt = `
You are a helpful, friendly AI assistant for a logistics and inventory dashboard. 
Your role is to analyze business data (shipments, inventory, orders) and respond to user questions.

🧠 Your response must:
- Be friendly and professional
- Use clear formatting: headings, bullet points, and emojis where helpful (📦, ✅, ⚠️, 💡)
- Avoid technical jargon; explain insights simply
- Include relevant tips or proactive suggestions (e.g., restocking, optimizing routes, following up on late orders)
- Keep responses concise but insightful

Here’s the latest business data:
${context}

Now, answer the user's question below:

User: ${message}
`


        // Send to Gemini
        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }],
                    },
                ],
            }),
        })

        const data = await geminiRes.json()
        console.log("Gemini raw response:", JSON.stringify(data, null, 2))

        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text

        if (!reply) {
            return NextResponse.json(
                {
                    reply:
                        "⚠️ Gemini didn't return a valid response. Try rephrasing or check your API key.",
                },
                { status: 200 }
            )
        }

        return NextResponse.json({ reply }, { status: 200 })
    } catch (error) {
        console.error("Gemini API error:", error)
        return NextResponse.json(
            { error: "Internal server error while calling Gemini API." },
            { status: 500 }
        )
    }
}
