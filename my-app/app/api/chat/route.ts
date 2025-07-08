import { NextRequest, NextResponse } from "next/server"

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

export async function POST(req: NextRequest) {
    const { message } = await req.json()
    const apiKey = process.env.GEMINI_API_KEY

    if (!message || !apiKey) {
        return NextResponse.json({ error: "Missing message or API key" }, { status: 400 })
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: message }],
                    },
                ],
            }),
        })

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't quite catch that. Can you rephrase?"

        return NextResponse.json({ reply: text })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Something went wrong with Gemini API." }, { status: 500 })
    }
}
