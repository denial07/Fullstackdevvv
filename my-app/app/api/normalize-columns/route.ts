// app/api/normalize-columns/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Shipment from "@/lib/models/Shipment"

const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent"

// 🔧 Utility to clean ```json blocks from Gemini response
function extractJsonBlock(raw: string): string {
    const match = raw.match(/```json\s*([\s\S]*?)```/i)
    return match ? match[1].trim() : raw.trim()
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: "Missing Gemini API key" },
                { status: 400 }
            )
        }

        // 1. Fetch all shipments from the database
        await connectToDatabase()
        const shipments = await Shipment.find().lean()

        if (!shipments || shipments.length === 0) {
            return NextResponse.json(
                { error: "No shipments found in database" },
                { status: 404 }
            )
        }

        // 2. Prompt for Gemini with all items
        const prompt = `
You are a data analyst assistant.

Given the following array of shipment objects:
${JSON.stringify(shipments, null, 2)}

Return a JSON object that semantically groups together fields that mean the same thing with high confidence (90%+). Each key should be a standardized label, and its value should be an array of original field names that represent the same concept.

✅ Do not include duplicates or overlapping labels.
✅ Only group if confidence is 90% or higher.
✅ Output only the JSON object. No explanations or formatting.

Example:
{
  "Destination": ["arrivalDestination", "destination"],
  "Shipment ID": ["id", "shipmentId"]
}
`.trim();

        // 3. Send to Gemini
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
        console.log("Gemini  raw response:", JSON.stringify(data, null, 2))

        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text

        if (!content || typeof content !== "string") {
            console.warn("⚠️ Gemini response missing or invalid:", data)
            return NextResponse.json({}, { status: 200 })
        }

        try {
            const cleaned = extractJsonBlock(content);
            const parsed = JSON.parse(cleaned) as Record<string, string[]>;

            // Optional: log it for clarity
            console.log("🧠 Parsed semantic alias map:", parsed);

            return NextResponse.json(parsed, { status: 200 });
        } catch (err) {
            console.error("❌ Gemini JSON parse failed:", err, "\nRaw content:", content);
            return NextResponse.json({}, { status: 200 });
        }

    } catch (error) {
        console.error("❌ normalize-columns API error:", error)
        return NextResponse.json(
            { error: "Internal server error while calling Gemini API." },
            { status: 500 }
        )
    }
}
