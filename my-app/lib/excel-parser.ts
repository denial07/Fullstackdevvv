import ExcelJS from "exceljs"

// Excel parsing utilities for inventory management system
export interface ExcelParseResult {
  success: boolean
  data?: any[]
  errors?: string[]
  rowCount?: number
}

export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    // Get the first worksheet
    const worksheet = workbook.worksheets[0]
    
    if (!worksheet) {
      return { success: false, errors: ["No worksheet found in Excel file"] }
    }

    // Convert to JSON format
    const jsonData: any[] = []
    const headerRow = worksheet.getRow(1)
    const headers: string[] = []
    
    // Extract headers
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || `Column${colNumber}`
    })

    // Extract data rows
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber)
      const rowData: any = {}
      let hasData = false

      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1]
        if (header) {
          rowData[header] = cell.value || ""
          if (cell.value) hasData = true
        }
      })

      if (hasData) {
        jsonData.push(rowData)
      }
    }

    if (jsonData.length === 0) {
      return { success: false, errors: ["Excel file is empty"] }
    }

    return {
      success: true,
      data: jsonData,
      rowCount: jsonData.length,
    }
  } catch (error: any) {
    return {
      success: false,
      errors: [`Failed to parse Excel file: ${error.message}`],
    }
  }
}

export function validateInventoryData(data: any[]): {
  valid: boolean
  validItems: any[]
  invalidItems: any[]
  errors: { row: number; errors: string[] }[]
} {
  const requiredFields = [
    "id",
    "item",
    "category",
    "quantity",
    "unit",
    "minStock",
    "maxStock",
    "location",
    "receivedDate",
    "expiryDate",
    "supplier",
    "costPerUnit",
  ]

  const validItems: any[] = []
  const invalidItems: any[] = []
  const errors: { row: number; errors: string[] }[] = []

  data.forEach((row, index) => {
    const rowErrors: string[] = []
    const rowNumber = index + 2 // +2 because Excel starts at 1 and we have a header row

    // Check for required fields
    for (const field of requiredFields) {
      if (row[field] === undefined || row[field] === "") {
        rowErrors.push(`Missing required field: ${field}`)
      }
    }

    // Validate numeric fields
    const numericFields = ["quantity", "minStock", "maxStock", "costPerUnit"]
    for (const field of numericFields) {
      if (row[field] !== undefined && row[field] !== "" && isNaN(Number(row[field]))) {
        rowErrors.push(`Field ${field} must be a number`)
      }
    }

    // Validate date fields
    const dateFields = ["receivedDate", "expiryDate"]
    for (const field of dateFields) {
      if (row[field] !== undefined && row[field] !== "") {
        const date = new Date(row[field])
        if (isNaN(date.getTime())) {
          rowErrors.push(`Field ${field} must be a valid date (YYYY-MM-DD)`)
        }
      }
    }

    // Validate ID format (optional)
    if (row.id && !row.id.toString().match(/^[A-Za-z0-9-]+$/)) {
      rowErrors.push("ID must contain only letters, numbers, and hyphens")
    }

    // Calculate status based on quantity and expiry date
    if (!rowErrors.length) {
      const quantity = Number(row.quantity)
      const minStock = Number(row.minStock)
      const expiryDate = new Date(row.expiryDate)
      const today = new Date()
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      let status = "Good"
      if (quantity <= minStock) {
        status = "Low Stock"
      }
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        status = "Expiring Soon"
      }
      if (daysUntilExpiry <= 0) {
        status = "Expired"
      }

      // Add status to the row
      row.status = status

      // Convert numeric fields to numbers
      for (const field of numericFields) {
        if (row[field] !== undefined && row[field] !== "") {
          row[field] = Number(row[field])
        }
      }

      validItems.push(row)
    } else {
      invalidItems.push(row)
      errors.push({ row: rowNumber, errors: rowErrors })
    }
  })

  return {
    valid: errors.length === 0,
    validItems,
    invalidItems,
    errors,
  }
}
