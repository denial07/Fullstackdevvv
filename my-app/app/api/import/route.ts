import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Inventory from "@/lib/models/Inventory"
import { parseExcelFile, validateInventoryData } from '@/lib/excel-parser'

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 API: Processing inventory import...")

    const contentType = request.headers.get('content-type')
    
    // Handle Excel file upload
    if (contentType?.includes('multipart/form-data')) {
      return await handleExcelImport(request)
    }
    
    // Handle JSON data import
    return await handleJsonImport(request)
  } catch (error: any) {
    console.error("❌ API Error during import:", error)

    return NextResponse.json(
      {
        error: "Failed to import inventory items",
        details: error.message,
        errorType: error.name,
      },
      { status: 500 },
    )
  }
}

// Handle Excel file import
async function handleExcelImport(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 }
    )
  }

  // Validate file type
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    return NextResponse.json(
      { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
      { status: 400 }
    )
  }

  console.log(`📄 Processing Excel file: ${file.name}`)

  // Parse the Excel file
  const parseResult = await parseExcelFile(file)

  if (!parseResult.success) {
    return NextResponse.json(
      { 
        error: 'Failed to parse Excel file',
        details: parseResult.errors?.join(', ') || 'Unknown parsing error'
      },
      { status: 400 }
    )
  }

  // Validate the data
  const validationResult = validateInventoryData(parseResult.data || [])

  if (!validationResult.valid) {
    return NextResponse.json(
      {
        error: 'Data validation failed',
        details: validationResult.errors.map(e => `Row ${e.row}: ${e.errors.join(', ')}`).join('; '),
        errors: validationResult.errors
      },
      { status: 400 }
    )
  }

  // Use the validated data from the parser (already processed and normalized)
  const inventoryItems = validationResult.validItems.map((item: any) => ({
    id: item.id || generateId(),
    item: item.item,
    category: item.category,
    quantity: item.quantity || 0,
    unit: item.unit || 'pcs',
    minStock: item.minStock || 0,
    maxStock: item.maxStock || 0,
    location: item.location,
    receivedDate: item.receivedDate || new Date().toISOString().split('T')[0],
    expiryDate: item.expiryDate || '',
    supplier: item.supplier,
    costPerUnit: item.costPerUnit || 0,
    status: item.status || 'Good',
    createdAt: new Date(),
    updatedAt: new Date()
  }))

  if (!inventoryItems || inventoryItems.length === 0) {
    return NextResponse.json(
      { error: 'No valid inventory items found in the file' },
      { status: 400 }
    )
  }

  return await processInventoryItems(inventoryItems, 'Excel')
}

// Handle JSON data import
async function handleJsonImport(request: NextRequest) {
  const data = await request.json()
  const { items } = data

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No valid items to import" }, { status: 400 })
  }

  console.log(`📊 Processing JSON data: ${items.length} items`)

  return await processInventoryItems(items, 'JSON')
}

// Common function to process inventory items (handles both Excel and JSON)
async function processInventoryItems(items: any[], source: string) {
  await connectToDatabase()

  // Check for duplicate IDs
  const existingIds = await Inventory.find({
    id: { $in: items.map((item) => item.id) },
  }).select("id")

  const duplicateIds = existingIds.map((item) => item.id)

  // Filter out items with duplicate IDs
  const newItems = items.filter((item) => !duplicateIds.includes(item.id))
  const updatedItems = items.filter((item) => duplicateIds.includes(item.id))

  // Insert new items
  let insertedCount = 0
  if (newItems.length > 0) {
    const insertResult = await Inventory.insertMany(newItems)
    insertedCount = insertResult.length
  }

  // Update existing items
  let updatedCount = 0
  for (const item of updatedItems) {
    await Inventory.updateOne({ id: item.id }, { 
      ...item,
      updatedAt: new Date()
    })
    updatedCount++
  }

  console.log(`✅ API: ${source} import completed - ${insertedCount} items inserted, ${updatedCount} items updated`)

  return NextResponse.json({
    success: true,
    message: `Successfully imported ${insertedCount + updatedCount} inventory items from ${source}`,
    insertedCount,
    updatedCount,
    duplicateIds,
    totalProcessed: insertedCount + updatedCount,
    source,
    imported: insertedCount + updatedCount
  })
}

// Helper functions
function generateId(): string {
  return 'WD' + Math.random().toString(36).substr(2, 6).toUpperCase()
}

function formatDate(dateValue: any): string {
  if (!dateValue) return new Date().toISOString().split('T')[0]
  
  // If it's already a string in YYYY-MM-DD format
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue
  }
  
  // Try to parse as date
  try {
    const date = new Date(dateValue)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  } catch (error) {
    // Invalid date
  }
  
  // Default to today
  return new Date().toISOString().split('T')[0]
}

function calculateStatus(quantity: number, minStock: number, expiryDate: string): string {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysToExpiry < 0) {
    return 'Expired'
  } else if (daysToExpiry <= 30) {
    return 'Expiring Soon'
  } else if (quantity <= minStock) {
    return 'Low Stock'
  } else {
    return 'Good'
  }
}
