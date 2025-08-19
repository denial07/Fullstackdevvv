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
   - "incoming": for shipments coming TO your company (deliveries, delays, arrivals, pickups by carriers, supplier shipments, inbound logistics, etc.)
   - "outgoing": for shipments going FROM your company (dispatch notifications, shipments you sent to customers, outbound deliveries, etc.)
3. "extractedData": object with relevant shipment information if found:
   - "trackingNumber": string (any tracking/reference number mentioned)
   - "shipmentId": string (generate a random shipment ID in format like "SHP123456" or "SH-IN-789012" for incoming, "SH-OUT-456789" for outgoing)
   - "status": string (MUST be one of: "In Transit", "Delayed", "Delivered" - choose the most appropriate)
   - "origin": string (pickup/source location)
   - "destination": string (delivery location - use "warehouse-A" as default if not specified)
   - "estimatedDelivery": string (delivery date/time in readable format like "January 18, 2025" or "2025-01-18")
   - "carrier": string (shipping company like FedEx, DHL, UPS, etc.)
   - "vendor": string (supplier/vendor name for incoming shipments)
   - "customer": string (customer name for outgoing shipments)
   - "driver": string (driver name if mentioned)
   - "vessel": string (ship/vessel name for ocean freight)
   - "vehicle": string (truck/vehicle details for ground transport)
   - "port": string (port of departure/arrival for sea freight)
   - "address": string (detailed pickup or delivery address)
   - "items": array of items being shipped with format: [{"name": "item name", "quantity": number, "description": "details", "price": number}]
   - "price": number (total shipment value or cost - extract numerical value only, no currency symbols)
   - "urgency": string ("high", "medium", "low" based on content urgency)
   - "actionRequired": boolean - true if recipient needs to take specific action
   - "notes": string (any additional important information or special instructions)
4. "summary": string - brief summary of the email content (max 200 characters)
5. "suggestedAction": string - what action should be taken based on this email

IMPORTANT CLASSIFICATION RULES:
- Most shipping notifications, delivery updates, and tracking emails are "incoming" shipments
- Only classify as "outgoing" if the email is about dispatching/sending items FROM your company TO customers
- Delay notifications, delivery confirmations, pickup schedules = "incoming"
- Dispatch confirmations, customer shipment notifications = "outgoing"

STATUS MAPPING:
- Use "In Transit" for: shipped, dispatched, on the way, en route, in transit
- Use "Delayed" for: delayed, postponed, rescheduled, weather delays, customs delays
- Use "Delivered" for: delivered, completed, arrived, received, signed for

PRICE EXTRACTION:
- Look for monetary amounts: $123.45, £50, €75.99, 1000.00, etc.
- Check keywords: cost, price, value, total, amount, fee, charge, invoice, bill
- Extract numerical value only (e.g., extract 123.45 from "$123.45")
- Sum up individual item prices if multiple items listed

ITEMS EXTRACTION:
- Extract product names, quantities, and individual prices
- Look for patterns like "10x Widget A - $50 each" or "5 units of Product B"
- Include model numbers, SKUs, part numbers if present
- Format as: [{"name": "product name", "quantity": 10, "description": "additional details", "price": 50.00}]

ADDITIONAL FIELD EXTRACTION:
- "vendor": Extract supplier/vendor company names for incoming shipments
- "customer": Extract customer company names for outgoing shipments  
- "driver": Look for driver names, driver IDs, or delivery personnel
- "vessel": Extract ship names, vessel numbers for ocean freight (e.g., "MV Ever Given", "Container Ship ABC-123")
- "vehicle": Extract truck details, vehicle plates, trailer numbers (e.g., "Truck SGX-1234A", "Trailer T-567")
- "port": Extract port names for sea freight (e.g., "Port of Singapore", "Shanghai Port", "Tanjung Pelepas")
- "address": Extract detailed street addresses for pickup/delivery locations (not just city names)

TRANSPORT MODE INDICATORS:
- Look for keywords: truck, vessel, ship, container, air freight, sea freight, ocean, port, dock, terminal
- Driver names often follow patterns: "Driver: John Smith", "Delivered by Mike Wong"
- Vehicle details: license plates, truck numbers, trailer IDs
- Vessel info: ship names, container numbers, bill of lading numbers

SHIPMENT ID GENERATION:
- Always generate a random shipment ID even if one is mentioned in the email
- Format for incoming: "SH-IN-" followed by 6 random digits (e.g., "SH-IN-123456")
- Format for outgoing: "SH-OUT-" followed by 6 random digits (e.g., "SH-OUT-789012")
- Use current timestamp or random numbers to ensure uniqueness
- This ID will be used as the main shipment identifier in the system

If the email is not shipment-related, return:
{
  "isShipmentRelated": false,
  "summary": "Brief summary of what the email is about"
}

Respond with only the JSON object, no additional text or formatting.
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
