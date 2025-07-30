import { NextRequest, NextResponse } from "next/server"
import { generateGeminiResponse } from "@/lib/geminiClient"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email content is required" },
        { status: 400 }
      )
    }

    const analysisPrompt = `
Analyze the following email and determine if it's related to shipments or logistics. If it is, extract the key information and format it as JSON.

Email Content:
Subject: ${email.subject}
From: ${email.from.name} <${email.from.email}>
Body: ${email.body}

Please analyze this email and respond with a JSON object containing:
1. "isShipmentRelated": boolean - true if this email is about shipments, deliveries, or logistics
2. "type": string - MUST be either "incoming" or "outgoing":
   - "incoming": for shipments coming TO your company (deliveries, delays, arrivals, pickups by carriers, etc.)
   - "outgoing": for shipments going FROM your company (dispatch notifications, shipments you sent out)
3. "extractedData": object with relevant shipment information if found:
   - "trackingNumber": string (if mentioned)
   - "shipmentId": string (if mentioned)
   - "status": string (current status like "In Transit", "Delayed", "Delivered", etc.)
   - "origin": string (pickup location)
   - "destination": string (delivery location)
   - "estimatedDelivery": string (delivery date/time if mentioned)
   - "carrier": string (shipping company)
   - "items": array of items being shipped
   - "urgency": string ("high", "medium", "low")
   - "actionRequired": boolean - if recipient needs to take action
   - "notes": string (any additional important information)
4. "summary": string - brief summary of the email content
5. "suggestedAction": string - what action should be taken based on this email

Important: Most shipping notifications (delays, deliveries, tracking updates) are about INCOMING shipments unless explicitly about something you sent out.

If the email is not shipment-related, return:
{
  "isShipmentRelated": false,
  "summary": "Brief summary of what the email is about"
}

Please respond with only the JSON object, no additional text.
`

    const geminiResponse = await generateGeminiResponse(analysisPrompt)
    
    // Clean up the response to ensure it's valid JSON
    let cleanedResponse = geminiResponse.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '')
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    try {
      const analysisResult = JSON.parse(cleanedResponse)
      
      return NextResponse.json({
        success: true,
        analysis: analysisResult
      })
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError)
      return NextResponse.json({
        success: false,
        error: "Failed to parse AI response",
        rawResponse: geminiResponse
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error("Error analyzing email:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to analyze email",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
