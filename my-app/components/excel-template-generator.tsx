"use client"

import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import ExcelJS from "exceljs"

export function ExcelTemplateGenerator() {
  const generateTemplate = async () => {
    // Create template data
    const templateData = [
      {
        id: "INV-XXX",
        item: "Item Name",
        category: "Category",
        quantity: 0,
        unit: "m³",
        minStock: 0,
        maxStock: 0,
        location: "Warehouse X-X",
        receivedDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        supplier: "Supplier Name",
        costPerUnit: 0,
      },
    ]

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Inventory Template")

    // Add headers
    const headers = Object.keys(templateData[0])
    worksheet.addRow(headers)

    // Add template data row
    worksheet.addRow(Object.values(templateData[0]))

    // Add column descriptions as comments
    const descriptions = {
      A1: "Unique ID (e.g., INV-001)",
      B1: "Item name", 
      C1: "Category (e.g., Hardwood, Softwood)",
      D1: "Current quantity (numeric)",
      E1: "Unit of measurement (e.g., m³)",
      F1: "Minimum stock level (numeric)",
      G1: "Maximum stock level (numeric)",
      H1: "Storage location (e.g., Warehouse A-1)",
      I1: "Date received (YYYY-MM-DD)",
      J1: "Expiry date (YYYY-MM-DD)",
      K1: "Supplier name",
      L1: "Cost per unit (numeric)",
    }

    // Add comments to header cells
    Object.entries(descriptions).forEach(([cell, comment]) => {
      const cellRef = worksheet.getCell(cell)
      cellRef.note = comment
    })

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Auto-fit column widths
    worksheet.columns.forEach(column => {
      column.width = 15
    })

    // Generate file and trigger download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory_import_template.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={() => generateTemplate()}>
      <FileDown className="h-4 w-4 mr-2" />
      Download Template
    </Button>
  )
}
