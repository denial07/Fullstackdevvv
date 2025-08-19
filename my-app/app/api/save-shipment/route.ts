import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Shipment from "@/lib/models/Shipment"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Connecting to database...")
    await connectToDatabase()
    console.log("✅ Database connected successfully")
    
    const { emailData, analysisResult } = await request.json()
    console.log("📧 Received data:", { 
      emailId: emailData?.id, 
      isShipmentRelated: analysisResult?.isShipmentRelated,
      type: analysisResult?.type 
    })

    if (!emailData || !analysisResult) {
      console.log("❌ Missing required data")
      return NextResponse.json(
        { error: "Email data and analysis result are required" },
        { status: 400 }
      )
    }

    if (!analysisResult.isShipmentRelated) {
      console.log("❌ Email is not shipment related")
      return NextResponse.json(
        { error: "Email is not shipment related" },
        { status: 400 }
      )
    }

    // Create shipment document compatible with existing Shipment model
    console.log("Creating shipment data with email ID:", emailData.id);
    console.log("Analysis result type:", analysisResult.type);
    
    // The AI should now return "incoming" or "outgoing" directly
    let shipmentType: 'incoming' | 'outgoing' = 'incoming'; // Default to incoming
    
    if (analysisResult.type === 'incoming' || analysisResult.type === 'outgoing') {
      shipmentType = analysisResult.type;
    } else {
      // Fallback logic for older analysis results
      if (analysisResult.type && (analysisResult.type.includes('outgoing') || analysisResult.type.includes('dispatch') || analysisResult.type.includes('sent'))) {
        shipmentType = 'outgoing';
      } else {
        shipmentType = 'incoming';
      }
    }
    
    console.log("Final shipment type:", shipmentType);
    
    // Use AI-generated shipment ID if available, otherwise generate one
    const businessId = analysisResult.extractedData?.shipmentId || 
      `SH-${shipmentType === 'incoming' ? 'IN' : 'OUT'}-${String(Date.now()).slice(-6)}`
    
    console.log("Using shipment ID:", businessId);
    
    const shipmentData = {
      id: businessId, // Required unique business ID in proper format
      type: shipmentType, // Required: incoming or outgoing
      status: analysisResult.extractedData?.status || 'In Transit', // Required
      price: analysisResult.extractedData?.price || 0, // Use extracted price or default to 0
      description: analysisResult.summary || 'Email-analyzed shipment',
      destination: analysisResult.extractedData?.destination || 'warehouse-A',
      vendor: shipmentType === 'incoming' ? (analysisResult.extractedData?.vendor || analysisResult.extractedData?.carrier || 'Email Vendor') : undefined,
      customer: shipmentType === 'outgoing' ? (analysisResult.extractedData?.customer || analysisResult.extractedData?.destination || 'Email Customer') : undefined,
      eta: analysisResult.extractedData?.estimatedDelivery ? 
        new Date(analysisResult.extractedData.estimatedDelivery) : undefined,
      // Save additional fields at top level for form accessibility
      trackingNumber: analysisResult.extractedData?.trackingNumber,
      driver: analysisResult.extractedData?.driver,
      vessel: analysisResult.extractedData?.vessel,
      vehicle: analysisResult.extractedData?.vehicle,
      port: analysisResult.extractedData?.port,
      address: analysisResult.extractedData?.address,
      // Store email-specific data in emailMetadata
      emailMetadata: {
        emailId: emailData.id,
        trackingNumber: analysisResult.extractedData?.trackingNumber,
        shipmentId: analysisResult.extractedData?.shipmentId,
        carrier: analysisResult.extractedData?.carrier,
        vendor: analysisResult.extractedData?.vendor,
        customer: analysisResult.extractedData?.customer,
        driver: analysisResult.extractedData?.driver,
        vessel: analysisResult.extractedData?.vessel,
        vehicle: analysisResult.extractedData?.vehicle,
        port: analysisResult.extractedData?.port,
        address: analysisResult.extractedData?.address,
        urgency: analysisResult.extractedData?.urgency,
        actionRequired: analysisResult.extractedData?.actionRequired,
        notes: analysisResult.extractedData?.notes,
        suggestedAction: analysisResult.suggestedAction,
        emailSubject: emailData.subject,
        emailFrom: emailData.from,
        emailTimestamp: new Date(emailData.timestamp),
        originalType: analysisResult.type, // Store the original AI analysis type
        items: analysisResult.extractedData?.items || [], // Store extracted items
        extractedPrice: analysisResult.extractedData?.price // Store original extracted price
      }
    }
    console.log("Shipment data created:", JSON.stringify(shipmentData, null, 2));

    // Check if shipment already exists (by email metadata)
    console.log("Checking for existing shipment with email ID:", emailData.id);
    const existingShipment = await Shipment.findOne({ 
      'emailMetadata.emailId': emailData.id 
    })
    console.log("Existing shipment found:", existingShipment ? existingShipment._id : "None");
    
    let savedShipment
    if (existingShipment) {
      // Update existing shipment
      console.log("Updating existing shipment:", existingShipment._id);
      savedShipment = await Shipment.findByIdAndUpdate(
        existingShipment._id,
        { ...shipmentData, updatedAt: new Date() },
        { new: true }
      )
      console.log("Shipment updated successfully:", savedShipment._id);
    } else {
      // Create new shipment
      console.log("Creating new shipment...");
      savedShipment = new Shipment(shipmentData)
      await savedShipment.save()
      console.log("New shipment created successfully:", savedShipment._id);
    }

    return NextResponse.json({
      success: true,
      message: existingShipment ? "Shipment updated successfully" : "Shipment created successfully",
      shipment: {
        id: savedShipment._id,
        trackingNumber: savedShipment.emailMetadata?.trackingNumber,
        status: savedShipment.status,
        type: savedShipment.type,
        summary: savedShipment.description,
        businessId: savedShipment.id
      }
    })

  } catch (error: any) {
    console.error("Error saving shipment:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to save shipment",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
