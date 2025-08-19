import ExcelJS from "exceljs"

// Excel parsing utilities for inventory management system
export interface ExcelParseResult {
  success: boolean
  data?: any[]
  errors?: string[]
  rowCount?: number
}

/** Map human headers to canonical field keys your validator expects. */
const HEADER_ALIASES: Record<string, string> = {
  // ids
  "id": "id",
  "sku": "id",
  "item id": "id",

  // item info
  "item": "item",
  "item name": "item",
  "description": "item",

  "category": "category",

  // quantities
  "qty": "quantity",
  "quantity": "quantity",
  "qty (container)": "quantity",

  "unit": "unit",
  "uom": "unit",

  "min stock": "minStock",
  "minstock": "minStock",
  "minimum stock": "minStock",

  "max stock": "maxStock",
  "maximum stock": "maxStock",
  "maxstock": "maxStock",

  // logistics
  "location": "location",
  "bin": "location",
  "location bin": "location",

  // dates
  "received date": "receivedDate",
  "date received": "receivedDate",
  "expiry date": "expiryDate",
  "exp date": "expiryDate",
  "expiration date": "expiryDate",

  // supplier & cost
  "supplier": "supplier",
  "supplier name": "supplier",
  "cost per unit": "costPerUnit",
  "unit cost": "costPerUnit",
  "cpu": "costPerUnit",
}

/** Normalize a header for alias lookup. */
function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ").replace(/[:/()-]+/g, " ")
}

/** Fallback: convert a label to camelCase key */
function camelize(h: string): string {
  const s = h.trim().toLowerCase()
  return s.replace(/[^a-z0-9]+(.)/g, (_m, c: string) => c.toUpperCase())
}

/** Extracts readable text from various ExcelJS cell value shapes. */
function cellText(val: ExcelJS.CellValue): string {
  if (val == null) return ""
  if (val instanceof Date) return val.toISOString()
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") return String(val)

  // ExcelJS rich text / hyperlinks / formulas
  const v: any = val
  if (v && typeof v === "object") {
    if (typeof v.text === "string") return v.text
    if (Array.isArray(v.richText)) return v.richText.map((r: any) => r.text ?? "").join("")
    if (v.hyperlink) return v.text ?? v.hyperlink
    if (v.formula !== undefined) return v.result != null ? String(v.result) : ""
  }
  return String(val)
}

/** Build unique header names to avoid collisions. */
function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>()
  return headers.map((h) => {
    const n = (seen.get(h) ?? 0) + 1
    seen.set(h, n)
    return n === 1 ? h : `${h} (${n})`
  })
}

/** Try to coerce incoming cell values into import-friendly primitives. */
function coerceValue(val: ExcelJS.CellValue): any {
  if (val == null) return ""
  if (val instanceof Date) return toISODate(val)

  // Formula / rich objects
  const v: any = val
  if (typeof v === "object" && !(v instanceof Date)) {
    if (v.result != null) return coerceValue(v.result)
    if (typeof v.text === "string") return v.text
    if (Array.isArray(v.richText)) return v.richText.map((r: any) => r.text ?? "").join("")
    if (v.hyperlink) return v.text ?? v.hyperlink
  }

  // Primitive
  if (typeof val === "number") return val
  if (typeof val === "boolean") return val
  if (typeof val === "string") return val.trim()

  return String(val)
}

/** Convert either Date | number (excel serial) | string into YYYY-MM-DD or '' if invalid. */
function toISODate(input: any): string {
  if (!input && input !== 0) return ""

  // Already a Date
  if (input instanceof Date && !isNaN(input.getTime())) {
    return input.toISOString().slice(0, 10)
  }

  // Excel serial date (rough check 1900-system). Common serial ranges ~ 25k..90k
  if (typeof input === "number" && input > 20000 && input < 100000) {
    const excelEpoch = new Date(Math.round((input - 25569) * 86400 * 1000)) // 25569 days from 1899-12-30 to 1970-01-01
    if (!isNaN(excelEpoch.getTime())) return excelEpoch.toISOString().slice(0, 10)
  }

  // Strings: try common formats, including dd/mm/yyyy
  if (typeof input === "string") {
    const s = input.trim()
    if (!s) return ""
    // dd/mm/yyyy or d/m/yy
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
    if (m) {
      const [_, d, mo, y] = m
      const yyyy = Number(y.length === 2 ? (Number(y) >= 70 ? "19" + y : "20" + y) : y)
      const mm = String(Number(mo)).padStart(2, "0")
      const dd = String(Number(d)).padStart(2, "0")
      const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`)
      if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
    }
    // Fallback: Date.parse
    const d2 = new Date(s)
    if (!isNaN(d2.getTime())) return d2.toISOString().slice(0, 10)
  }

  return ""
}

export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return { success: false, errors: ["No worksheet found in Excel file"] }
    }

    // Header row = first row with at least 2 non-empty cells (fallback to row 1)
    let headerRowIdx = 1
    for (let r = 1; r <= Math.min(5, worksheet.rowCount || 1); r++) {
      const row = worksheet.getRow(r)
      const nonEmpty =
        ((row.values ?? []) as any[]).filter(
          (v) => v != null && String(v).trim() !== ""
        ).length
      if (nonEmpty >= 2) { headerRowIdx = r; break }
    }

    const headerRow = worksheet.getRow(headerRowIdx)
    const rawHeaders: string[] = []

    headerRow.eachCell((cell, colNumber) => {
      const text = cellText(cell.value as any) || `Column${colNumber}`
      rawHeaders[colNumber - 1] = text
    })

    if (rawHeaders.length === 0) {
      return { success: false, errors: ["Header row appears to be empty"] }
    }

    // Build canonical key list (apply aliases; preserve original header label for debugging)
    let headers = uniqueHeaders(rawHeaders.map(h => h || ""))
    const canonicalKeys = headers.map(h => HEADER_ALIASES[normHeader(h)] ?? camelize(h))

    // Extract rows beneath header
    const jsonData: any[] = []
    const lastRow = worksheet.actualRowCount || worksheet.rowCount || headerRowIdx
    for (let rowNumber = headerRowIdx + 1; rowNumber <= lastRow; rowNumber++) {
      const row = worksheet.getRow(rowNumber)
      const rowObj: any = {}
      let hasData = false

      for (let c = 1; c <= headers.length; c++) {
        const key = canonicalKeys[c - 1]
        const cell = row.getCell(c)
        const val = coerceValue(cell.value as any)

        // Normalize potential date-like values onto date fields by key heuristic
        if (/(receiveddate|expirydate)$/i.test(key)) {
          const iso = toISODate(val)
          rowObj[key] = iso
          if (iso) hasData = true
        } else {
          // leave as string/number/bool
          rowObj[key] = val
          if (val !== "" && val != null) hasData = true
        }
      }

      if (hasData) jsonData.push(rowObj)
    }

    if (jsonData.length === 0) {
      return { success: false, errors: ["Excel file has no data rows under the header"] }
    }

    return {
      success: true,
      data: jsonData,
      rowCount: jsonData.length,
    }
  } catch (error: any) {
    return {
      success: false,
      errors: [`Failed to parse Excel file: ${error?.message ?? String(error)}`],
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

  const numericFields = ["quantity", "minStock", "maxStock", "costPerUnit"]
  const dateFields = ["receivedDate", "expiryDate"]

  const validItems: any[] = []
  const invalidItems: any[] = []
  const errors: { row: number; errors: string[] }[] = []

  function toNumber(v: any): number | null {
    if (v === "" || v == null) return null
    if (typeof v === "number") return v
    if (typeof v === "string") {
      const s = v.replace(/,/g, "").trim()
      const n = Number(s)
      return isNaN(n) ? null : n
    }
    return isNaN(Number(v)) ? null : Number(v)
  }

  function onlyDate(iso: string): string {
    if (!iso) return ""
    const d = new Date(iso)
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10)
  }

  data.forEach((row, index) => {
    const rowErrors: string[] = []
    const rowNumber = index + 2 // assuming header is on row 1

    // Required fields present & non-empty
    for (const field of requiredFields) {
      if (row[field] === undefined || row[field] === null || String(row[field]).trim() === "") {
        rowErrors.push(`Missing required field: ${field}`)
      }
    }

    // Numbers
    for (const field of numericFields) {
      const n = toNumber(row[field])
      if (row[field] !== undefined && row[field] !== "" && n === null) {
        rowErrors.push(`Field ${field} must be a number`)
      } else if (n !== null) {
        row[field] = n
      }
    }

    // Dates
    for (const field of dateFields) {
      if (row[field] !== undefined && row[field] !== "") {
        const iso = onlyDate(toISODate(row[field]))
        if (!iso) {
          rowErrors.push(`Field ${field} must be a valid date (YYYY-MM-DD)`)
        } else {
          row[field] = iso
        }
      }
    }

    // ID format
    if (row.id && !row.id.toString().match(/^[A-Za-z0-9-]+$/)) {
      rowErrors.push("ID must contain only letters, numbers, and hyphens")
    }

    // Compute status only if no structural errors
    if (!rowErrors.length) {
      const quantity = Number(row.quantity ?? 0)
      const minStock = Number(row.minStock ?? 0)
      const expiryISO = row.expiryDate ? String(row.expiryDate) : ""
      let status = "Good"

      if (quantity <= minStock) status = "Low Stock"

      if (expiryISO) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const expiry = new Date(expiryISO + "T00:00:00Z")
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) status = "Expiring Soon"
        if (daysUntilExpiry <= 0) status = "Expired"
      }

      row.status = status
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
