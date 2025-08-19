"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  Download,
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  Loader2,
  RefreshCw,
  X,
  SlidersHorizontal,
  Edit3,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingDown as TrendingDownIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
// Import the new components at the top of the file
import { ExcelImportModal } from "@/components/excel-import-modal"
import { ExcelTemplateGenerator } from "@/components/excel-template-generator"
import ExcelJS from "exceljs"

interface InventoryItem {
  _id: string
  id: string
  item: string
  category: string
  quantity: number
  unit: string
  minStock: number
  maxStock: number
  location: string
  receivedDate: string
  expiryDate: string
  supplier: string
  costPerUnit: number
  status: string
}

interface Filters {
  category: string
  status: string
  location: string
  supplier: string
  minQuantity: string
  maxQuantity: string
  minCost: string
  maxCost: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Good":
      return "default"
    case "Low Stock":
      return "secondary"
    case "Expiring Soon":
      return "destructive"
    case "Expired":
      return "destructive"
    default:
      return "secondary"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Low Stock":
      return <TrendingDown className="h-4 w-4" />
    case "Expiring Soon":
      return <Clock className="h-4 w-4" />
    case "Expired":
      return <AlertTriangle className="h-4 w-4" />
    default:
      return null
  }
}

// Enhanced status functions for better visual representation
const getEnhancedStatusBadge = (item: InventoryItem) => {
  const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
  const stockPercentage = (item.quantity / item.maxStock) * 100
  
  const isLowStock = stockPercentage < 20
  const isExpiringSoon = daysToExpiry < 30 && daysToExpiry >= 0
  const isExpired = daysToExpiry < 0
  
  let statuses = []
  
  // Priority order: Expired > Expiring Soon > Low Stock > Good
  if (isExpired) {
    statuses.push({ 
      text: "Expired", 
      icon: "⛔", 
      color: "bg-red-100 text-red-800 border-red-200",
      priority: 1 
    })
  } else if (isExpiringSoon) {
    statuses.push({ 
      text: "Expiring Soon", 
      icon: "⚠️", 
      color: "bg-orange-100 text-orange-800 border-orange-200",
      priority: 2 
    })
  }
  
  if (isLowStock) {
    statuses.push({ 
      text: "Low Stock", 
      icon: "📉", 
      color: "bg-blue-100 text-blue-800 border-blue-200",
      priority: 3 
    })
  }
  
  if (statuses.length === 0) {
    statuses.push({ 
      text: "Good", 
      icon: "✅", 
      color: "bg-green-100 text-green-800 border-green-200",
      priority: 4 
    })
  }
  
  // If multiple statuses, combine them
  if (statuses.length > 1) {
    const combinedText = statuses.map(s => s.text).join(" | ")
    const primaryStatus = statuses[0] // Use the highest priority color
    return {
      text: combinedText,
      icon: statuses[0].icon,
      color: primaryStatus.color
    }
  }
  
  return statuses[0]
}

const getStockLevelColor = (percentage: number) => {
  if (percentage < 20) return "bg-red-500"
  if (percentage < 50) return "bg-yellow-500"
  return "bg-green-500"
}

const getExpiryProgressColor = (daysToExpiry: number) => {
  if (daysToExpiry < 0 || daysToExpiry < 30) return "bg-red-500"
  if (daysToExpiry < 90) return "bg-yellow-500"
  return "bg-green-500"
}

const getDaysUntilExpiry = (expiryDate: string) => {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Function to check and process delivered shipments for inventory integration
const processDeliveredShipments = async () => {
  try {
    console.log("🔄 Checking for delivered shipments to add to inventory...")
    
    // Fetch all shipments with detailed logging
    console.log("📡 Fetching shipments from /api/shipments...")
    const shipmentsResponse = await fetch('/api/shipments')
    console.log("📡 Shipments response status:", shipmentsResponse.status)
    
    if (!shipmentsResponse.ok) {
      const errorText = await shipmentsResponse.text()
      console.error("❌ Shipments fetch failed:", errorText)
      throw new Error(`Failed to fetch shipments: ${shipmentsResponse.status} ${errorText}`)
    }
    
    const allShipments = await shipmentsResponse.json()
    console.log("📦 Total shipments fetched:", allShipments.length)
    console.log("📦 Sample shipment structure:", allShipments[0] || "No shipments found")
    
    // Filter for delivered incoming shipments that haven't been processed
    const deliveredShipments = allShipments.filter((shipment: any) => {
      const status = shipment.status || shipment.Status
      const type = shipment.type || shipment.Type
      const processed = shipment.processedToInventory || shipment.processed_to_inventory
      
      console.log(`🔍 Shipment ${shipment._id}: status=${status}, type=${type}, processed=${processed}`)
      
      return (
        status?.toLowerCase() === 'delivered' &&
        type?.toLowerCase() === 'incoming' &&
        !processed // Only unprocessed shipments
      )
    })
    
    console.log(`📋 Filtered delivered shipments: ${deliveredShipments.length}`)
    
    if (deliveredShipments.length === 0) {
      console.log("✅ No new delivered shipments to process")
      return { processed: 0, skipped: 0 }
    }
    
    console.log(`📦 Found ${deliveredShipments.length} delivered shipments to process`)
    console.log("📦 First delivered shipment:", deliveredShipments[0])
    
    let processed = 0
    let skipped = 0
    
    for (const shipment of deliveredShipments) {
      try {
        console.log(`🔄 Processing shipment:`, shipment._id)
        
        // Extract relevant data from shipment
        const description = shipment.description || shipment.Description || 'Unknown Material'
        const quantity = parseFloat(shipment.qty || shipment.quantity || shipment.Quantity || '0')
        const vendor = shipment.vendor || shipment.Vendor || shipment.supplier || 'Unknown Supplier'
        const weight = parseFloat(shipment.weight || shipment.Weight || '0')
        const trackingNumber = shipment.trackingNumber || shipment.tracking || shipment.Tracking
        
        console.log(`📊 Extracted data: desc=${description}, qty=${quantity}, vendor=${vendor}, tracking=${trackingNumber}`)
        
        // Skip if essential data is missing
        if (!description || description === 'Unknown Material' || quantity <= 0) {
          console.log(`⚠️ Skipping shipment ${trackingNumber}: Missing essential data (desc="${description}", qty=${quantity})`)
          skipped++
          continue
        }
        
        // Create inventory item from shipment data
        const inventoryItem = {
          id: `SHP-${trackingNumber || Date.now()}`,
          item: description,
          category: 'Imported', // Default category for shipments
          quantity: quantity,
          unit: 'm³', // Default unit
          minStock: Math.floor(quantity * 0.2), // 20% of received quantity
          maxStock: Math.floor(quantity * 3), // 3x received quantity
          location: 'Singapore Warehouse', // Default to Singapore warehouse
          receivedDate: shipment.eta || shipment.ETA || new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
          supplier: vendor,
          costPerUnit: 500, // Default cost per unit
          status: 'Good'
        }
        
        console.log(`📦 Creating inventory item:`, inventoryItem)
        
        // Add to inventory via API
        const addResponse = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inventoryItem)
        })
        
        console.log(`📡 Inventory POST response status:`, addResponse.status)
        
        if (addResponse.ok) {
          const responseData = await addResponse.json()
          console.log(`✅ Successfully added to inventory:`, responseData)
          
          // Mark shipment as processed
          const updateResponse = await fetch(`/api/shipments/${shipment._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ processedToInventory: true })
          })
          
          console.log(`📡 Shipment update response status:`, updateResponse.status)
          
          if (updateResponse.ok) {
            console.log(`✅ Marked shipment ${trackingNumber} as processed`)
          } else {
            console.log(`⚠️ Failed to mark shipment as processed, but inventory was added`)
          }
          
          processed++
        } else {
          const errorText = await addResponse.text()
          console.log(`❌ Failed to add shipment ${trackingNumber} to inventory:`, errorText)
          skipped++
        }
        
      } catch (error) {
        console.error(`❌ Error processing individual shipment:`, error)
        skipped++
      }
    }
    
    console.log(`🎉 Processing complete: ${processed} processed, ${skipped} skipped`)
    return { processed, skipped }
    
  } catch (error: any) {
    console.error("❌ Error processing delivered shipments:", error)
    return { processed: 0, skipped: 0, error: error.message }
  }
}

// Function to check if delivered shipments should be displayed on inventory
const shouldDisplayDeliveredShipments = async () => {
  try {
    const result = await processDeliveredShipments()
    
    if (result.processed > 0) {
      toast.success(`📦 Inventory Updated!`, {
        description: `Added ${result.processed} delivered shipments to inventory${result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}`,
        duration: 5000,
      })
      return true // Indicates inventory was updated
    } else if (result.error) {
      toast.error("Failed to process shipments", {
        description: result.error,
        duration: 4000,
      })
    }
    
    return false // No updates made
  } catch (error) {
    console.error("Error in shouldDisplayDeliveredShipments:", error)
    return false
  }
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFiltering, setIsFiltering] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [filters, setFilters] = useState<Filters>({
    category: "",
    status: "",
    location: "",
    supplier: "",
    minQuantity: "",
    maxQuantity: "",
    minCost: "",
    maxCost: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null,
  })
  const [deletingItem, setDeletingItem] = useState<string | null>(null)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [bulkEditData, setBulkEditData] = useState({
    location: "",
    quantity: "",
    name: ""
  })
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const router = useRouter()
  // Add state for the import modal inside the InventoryPage component
  const [showImportModal, setShowImportModal] = useState(false)
  // Add state for expanded row details
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  // Add state for shipment processing
  const [isProcessingShipments, setIsProcessingShipments] = useState(false)

  // Simplified column configuration - decluttered and grouped
  const defaultColumns = [
    { key: "select", label: "", width: "w-12" },
    { key: "item", label: "Item Details", width: "w-96" }, // Wider for item name + status
    { key: "category", label: "Category", width: "w-28" },
    { key: "stockInfo", label: "Stock Info", width: "w-40" }, // Combined quantity + stock level
    { key: "expiryInfo", label: "Expiry Info", width: "w-36" }, // Combined expiry + days
    { key: "location", label: "Location", width: "w-32" },
    { key: "value", label: "Value (S$)", width: "w-28 text-right" },
    { key: "actions", label: "Actions", width: "w-24" },
  ]

  const [columnOrder, setColumnOrder] = useState(defaultColumns)
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null)

  // Load column order from localStorage on component mount
  useEffect(() => {
    const savedOrder = localStorage.getItem("inventory-column-order")
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder)
        setColumnOrder(parsed)
      } catch (error) {
        console.error("Failed to load column order:", error)
      }
    }
  }, [])

  // Save column order to localStorage with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("inventory-column-order", JSON.stringify(columnOrder))
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [columnOrder])

  // Drag and drop handlers with proper TypeScript types
  const handleDragStart = (e: React.DragEvent<HTMLTableCellElement>, index: number) => {
    setDraggedColumn(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", e.currentTarget.outerHTML)

    // Type assertion for style manipulation
    const target = e.currentTarget as HTMLElement
    target.style.opacity = "0.5"
  }

  const handleDragEnd = (e: React.DragEvent<HTMLTableCellElement>) => {
    // Type assertion for style manipulation
    const target = e.currentTarget as HTMLElement
    target.style.opacity = "1"

    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(index)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, dropIndex: number) => {
    e.preventDefault()

    if (draggedColumn === null || draggedColumn === dropIndex) return

    const newColumnOrder = [...columnOrder]
    const draggedItem = newColumnOrder[draggedColumn]

    // Remove dragged item
    newColumnOrder.splice(draggedColumn, 1)

    // Insert at new position
    const insertIndex = draggedColumn < dropIndex ? dropIndex - 1 : dropIndex
    newColumnOrder.splice(insertIndex, 0, draggedItem)

    setColumnOrder(newColumnOrder)
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const resetColumnOrder = () => {
    setColumnOrder(defaultColumns)
    localStorage.removeItem("inventory-column-order")
  }

  // Function to render cell content based on column key
  const renderCellContent = useCallback((item: InventoryItem, columnKey: string) => {
    const stockPercentage = (item.quantity / item.maxStock) * 100
    const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
    const isExpanded = expandedRows.has(item.id)

    // Consistent color scheme
    const getStatusColor = (status: string) => {
      switch (status) {
        case "Good": return "text-green-700 bg-green-100 border-green-200"
        case "Low Stock": return "text-amber-700 bg-amber-100 border-amber-200"
        case "Expiring Soon": return "text-amber-700 bg-amber-100 border-amber-200"
        case "Expired": return "text-red-700 bg-red-100 border-red-200"
        default: return "text-gray-700 bg-gray-100 border-gray-200"
      }
    }

    const getStockColor = (percentage: number) => {
      if (percentage >= 75) return "bg-green-500"
      if (percentage >= 25) return "bg-amber-500"
      return "bg-red-500"
    }

    const getExpiryColor = (days: number) => {
      if (days < 0) return "bg-red-500"
      if (days <= 30) return "bg-amber-500"
      return "bg-green-500"
    }

    switch (columnKey) {
      case "select":
        return (
          <Checkbox
            checked={selectedItems.includes(item.id)}
            onCheckedChange={() => handleSelectItem(item.id)}
            onClick={(e) => e.stopPropagation()}
          />
        )

      case "item":
        const statusBadge = getEnhancedStatusBadge(item)
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {/* Large, bold item name */}
              <div className="flex-1">
                <div className="font-bold text-lg text-gray-900 leading-tight">
                  {item.item}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  ID: {item.id}
                </div>
              </div>
              {/* Status badge directly beside name - Fixed width for consistency */}
              <span className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-semibold min-w-[100px] text-center ${getStatusColor(item.status)}`}>
                {statusBadge.icon}
                {statusBadge.text}
              </span>
            </div>
            
            {/* Expandable details */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                const newExpanded = new Set(expandedRows)
                if (isExpanded) {
                  newExpanded.delete(item.id)
                } else {
                  newExpanded.add(item.id)
                }
                setExpandedRows(newExpanded)
              }}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {isExpanded ? '▼' : '▶'} {isExpanded ? 'Less' : 'More'} details
            </button>

            {/* Hidden detail view */}
            {isExpanded && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border space-y-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Received:</span>
                    <div className="font-medium">{item.receivedDate}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Supplier:</span>
                    <div className="font-medium">{item.supplier}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Cost/Unit:</span>
                    <div className="font-medium">S${item.costPerUnit}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Min/Max Stock:</span>
                    <div className="font-medium">{item.minStock}/{item.maxStock} {item.unit}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case "category":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
            {item.category}
          </span>
        )

      case "stockInfo":
        return (
          <div className="space-y-2">
            <div className="text-center">
              <div className="font-bold text-lg">
                {item.quantity.toLocaleString()} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
              </div>
            </div>
            
            {/* Stock level bar with consistent colors */}
            <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${getStockColor(stockPercentage)}`}
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              />
            </div>
            
            <div className="text-xs text-center">
              <span className={`font-medium ${stockPercentage >= 75 ? 'text-green-600' : stockPercentage >= 25 ? 'text-amber-600' : 'text-red-600'}`}>
                {stockPercentage.toFixed(0)}% capacity
              </span>
            </div>
          </div>
        )

      case "expiryInfo":
        const maxDays = 365
        const progressPercentage = daysToExpiry < 0 ? 0 : Math.min((daysToExpiry / maxDays) * 100, 100)
        
        return (
          <div className="space-y-2">
            <div className="text-center">
              <div className="font-bold text-sm">
                {item.expiryDate}
              </div>
            </div>
            
            {/* Expiry progress bar with consistent colors */}
            <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${getExpiryColor(daysToExpiry)}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <div className="text-xs text-center">
              <span className={`font-medium ${
                daysToExpiry < 0 ? "text-red-600" 
                : daysToExpiry <= 30 ? "text-amber-600" 
                : "text-green-600"
              }`}>
                {daysToExpiry < 0 ? `${Math.abs(daysToExpiry)}d overdue` : `${daysToExpiry}d left`}
              </span>
            </div>
          </div>
        )

      case "location":
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
            {item.location}
          </span>
        )

      case "value":
        return (
          <div className="text-right">
            <div className="font-bold text-lg">
              S${(item.quantity * item.costPerUnit).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
            <div className="text-xs text-gray-500">
              @S${item.costPerUnit}/{item.unit}
            </div>
          </div>
        )

      case "actions":
        return (
          <div className="edit-controls flex items-center justify-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteDialog({ open: true, item })
              }}
              title="Delete item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )

      default:
        return null
    }
  }, [selectedItems, expandedRows])

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchInventory = useCallback(async (page = 1, limit = 1000) => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Fetching inventory directly...")
      const response = await fetch(`/api/inventory?page=${page}&limit=${limit}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`${errorData.error}: ${errorData.details || ""}`)
      }

      const result = await response.json()

      if (result.isEmpty) {
        setError("No inventory data found. Please run the seeding script to populate the database.")
        setInventory([])
      } else {
        // Handle both old format (direct array) and new format (with pagination)
        const data = result.data || result
        setInventory(Array.isArray(data) ? data : [])
        console.log("✅ Successfully loaded inventory data")
      }
    } catch (err: any) {
      console.error("❌ Error fetching inventory:", err)
      setError(err.message || "An error occurred while fetching inventory")
      setInventory([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Export all inventory items to Excel in the same format as the template
  const exportToExcel = useCallback(async () => {
    if (inventory.length === 0) {
      toast.error("No inventory data to export")
      return
    }

    try {
      toast.loading("Preparing export...", { id: "export" })

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Inventory Export")

      // Define headers matching the template format
      const headers = [
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
        "costPerUnit"
      ]

      // Add headers
      worksheet.addRow(headers)

      // Add data rows
      inventory.forEach(item => {
        worksheet.addRow([
          item.id,
          item.item,
          item.category,
          item.quantity,
          item.unit,
          item.minStock,
          item.maxStock,
          item.location,
          item.receivedDate,
          item.expiryDate,
          item.supplier,
          item.costPerUnit
        ])
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
      
      // Generate filename with current date
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      a.download = `inventory_export_${dateStr}.xlsx`
      
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success(`Exported ${inventory.length} items to Excel`, { id: "export" })
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export inventory", { id: "export" })
    }
  }, [inventory])

  // Fetch inventory on component mount
  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  const handleRowClick = (itemId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on edit controls
    if ((event.target as HTMLElement).closest(".edit-controls")) {
      return
    }
    router.push(`/inventory/${itemId}`)
  }

  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      category: "",
      status: "",
      location: "",
      supplier: "",
      minQuantity: "",
      maxQuantity: "",
      minCost: "",
      maxCost: "",
    })
    setSearchTerm("")
  }, [])

  // Card filter handlers
  const handleLowStockFilter = useCallback(() => {
    clearFilters()
    setFilters(prev => ({ ...prev, status: "Low Stock" }))
    toast.success("Applied Low Stock filter")
  }, [clearFilters])

  const handleExpiringSoonFilter = useCallback(() => {
    clearFilters()
    setFilters(prev => ({ ...prev, status: "Expiring Soon" }))
    toast.success("Applied Expiring Soon filter")
  }, [clearFilters])

  const handleExpiredFilter = useCallback(() => {
    clearFilters()
    setFilters(prev => ({ ...prev, status: "Expired" }))
    toast.success("Applied Expired filter")
  }, [clearFilters])

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((value) => value !== "").length + (debouncedSearchTerm ? 1 : 0)
  }, [filters, debouncedSearchTerm])

  // Keep the function for backward compatibility but use the memoized value
  const getActiveFilterCount = () => activeFilterCount

  // Bulk edit functions
  const handleSelectAllItems = () => {
    const currentPageIds = paginatedInventory.map(item => item.id)
    const allCurrentPageSelected = currentPageIds.every(id => selectedItems.includes(id))
    
    if (allCurrentPageSelected) {
      // Deselect all items on current page
      setSelectedItems(prev => prev.filter(id => !currentPageIds.includes(id)))
    } else {
      // Select all items on current page
      setSelectedItems(prev => [...prev.filter(id => !currentPageIds.includes(id)), ...currentPageIds])
    }
  }

  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }, [])

  const handleBulkEdit = () => {
    if (selectedItems.length === 0) {
      toast.error("No items selected", {
        description: "Please select items to edit",
      })
      return
    }
    setShowBulkEditModal(true)
  }

  const handleBulkUpdate = async () => {
    if (selectedItems.length === 0) return
    setIsBulkUpdating(true)
    try {
      const updates: any = {}
      if (bulkEditData.location.trim() && bulkEditData.location !== "KEEP_CURRENT") updates.location = bulkEditData.location.trim()
      if (bulkEditData.name.trim()) updates.item = bulkEditData.name.trim()
      if (bulkEditData.quantity.trim()) {
        const quantity = parseInt(bulkEditData.quantity)
        if (quantity >= 0) updates.quantity = quantity
      }

      if (Object.keys(updates).length === 0) {
        toast.error("No changes specified", {
          description: "Please enter at least one field to update",
        })
        return
      }

      const response = await fetch('/api/inventory/bulk-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemIds: selectedItems,
          updates
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update items')
      }

      const result = await response.json()

      // Update local state
      setInventory(prev => 
        prev.map(item => 
          selectedItems.includes(item.id) 
            ? { ...item, ...updates }
            : item
        )
      )

      // Reset form and close modal
      setBulkEditData({ location: "", quantity: "", name: "" })
      setSelectedItems([])
      setShowBulkEditModal(false)

      toast.success("Bulk update completed! 📦", {
        description: `Updated ${selectedItems.length} items successfully`,
      })

    } catch (error: any) {
      console.error("Error updating items:", error)
      toast.error("Failed to update items", {
        description: error.message || "Please try again or contact support",
      })
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const deleteItem = async (item: InventoryItem) => {
    setDeletingItem(item.id)

    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete item")
      }

      // Remove item from local state
      setInventory((prev) => prev.filter((inventoryItem) => inventoryItem.id !== item.id))

      // Close dialog
      setDeleteDialog({ open: false, item: null })

      toast.success("Item deleted successfully! 🗑️", {
        description: `${item.item} has been removed from inventory`,
      })
    } catch (error: any) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item", {
        description: error.message || "Please try again or contact support",
      })
    } finally {
      setDeletingItem(null)
    }
  }

  // Add this function inside the InventoryPage component
  const handleProcessDeliveredShipments = async () => {
    console.log("🔘 Button clicked - starting shipment processing...")
    toast.info("Processing shipments...", { description: "Checking for delivered shipments to add to inventory" })
    
    setIsProcessingShipments(true)
    
    try {
      const result = await shouldDisplayDeliveredShipments()
      console.log("🎯 Processing result:", result)
      
      if (result) {
        // Refresh inventory data after processing shipments
        console.log("🔄 Refreshing inventory data...")
        await fetchInventory()
      }
    } catch (error) {
      console.error("❌ Error in handleProcessDeliveredShipments:", error)
      toast.error("Error processing shipments", { description: String(error) })
    } finally {
      setIsProcessingShipments(false)
    }
  }

  const handleImportSuccess = () => {
    fetchInventory()
  }

  // Get unique values for filter dropdowns - memoized for performance
  const uniqueCategories = useMemo(() => 
    [...new Set(inventory.map((item) => item.category).filter(Boolean))].sort(), 
    [inventory]
  )
  const uniqueStatuses = useMemo(() => 
    [...new Set(inventory.map((item) => item.status).filter(Boolean))].sort(), 
    [inventory]
  )
  const uniqueLocations = useMemo(() => 
    [...new Set(inventory.map((item) => item.location).filter(Boolean))].sort(), 
    [inventory]
  )
  const uniqueSuppliers = useMemo(() => 
    [...new Set(inventory.map((item) => item.supplier).filter(Boolean))].sort(), 
    [inventory]
  )

  const filteredInventory = useMemo(() => {
    if (inventory.length > 100) {
      setIsFiltering(true)
    }
    
    const result = inventory.filter((item) => {
      // Search filter - use debounced search term
      const matchesSearch =
        !debouncedSearchTerm ||
        item.item.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

      // Category filter
      const matchesCategory = !filters.category || item.category === filters.category

      // Status filter
      const matchesStatus = !filters.status || item.status === filters.status

      // Location filter
      const matchesLocation = !filters.location || item.location === filters.location

      // Supplier filter
      const matchesSupplier = !filters.supplier || item.supplier === filters.supplier

      // Quantity filters
      const matchesMinQuantity = !filters.minQuantity || item.quantity >= Number.parseInt(filters.minQuantity)
      const matchesMaxQuantity = !filters.maxQuantity || item.quantity <= Number.parseInt(filters.maxQuantity)

      // Cost filters
      const matchesMinCost = !filters.minCost || item.costPerUnit >= Number.parseFloat(filters.minCost)
      const matchesMaxCost = !filters.maxCost || item.costPerUnit <= Number.parseFloat(filters.maxCost)

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesLocation &&
        matchesSupplier &&
        matchesMinQuantity &&
        matchesMaxQuantity &&
        matchesMinCost &&
        matchesMaxCost
      )
    })
    
    setIsFiltering(false)
    return result
  }, [inventory, debouncedSearchTerm, filters])

  // Pagination calculations
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredInventory.length])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of table
    const tableElement = document.getElementById('inventory-table')
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  // Memoize expensive calculations with enhanced status logic
  const { totalItems, lowStockItems, expiringSoonItems, expiredItems, totalValue } = useMemo(() => {
    const totalItems = inventory.length
    
    // Use enhanced logic for better counting
    const lowStockItems = inventory.filter(item => {
      const stockPercentage = (item.quantity / item.maxStock) * 100
      return stockPercentage < 20
    }).length
    
    const expiringSoonItems = inventory.filter(item => {
      const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
      return daysToExpiry < 30 && daysToExpiry >= 0
    }).length
    
    const expiredItems = inventory.filter(item => {
      const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
      return daysToExpiry < 0
    }).length
    
    const totalValue = inventory.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0)
    
    return { totalItems, lowStockItems, expiringSoonItems, expiredItems, totalValue }
  }, [inventory])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <div className="text-center">
            <p className="text-lg font-medium">Loading inventory...</p>
            <p className="text-sm text-gray-500">Connecting to database...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Database Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Quick Fix Steps:</h4>
              <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                <li>Check your MongoDB Atlas connection string in .env.local</li>
                <li>Verify your database user has proper permissions</li>
                <li>Ensure your IP is whitelisted in Network Access</li>
                <li>Try running the seeding script if database is empty</li>
                <li>Check MongoDB Atlas cluster status</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Environment Check:</h4>
              <p className="text-sm text-yellow-700">
                Make sure your <code>.env.local</code> file contains:
              </p>
              <pre className="text-xs bg-yellow-100 p-2 rounded mt-2 overflow-x-auto">
                MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database?retryWrites=true&w=majority
              </pre>
            </div>

            <Button onClick={() => fetchInventory()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600">Track wood inventory and expiry dates</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToExcel}
                disabled={inventory.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleProcessDeliveredShipments}
                disabled={isProcessingShipments}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isProcessingShipments ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Process Shipments
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import Excel
              </Button>
              <ExcelTemplateGenerator />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">{filteredInventory.length} filtered</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleLowStockFilter}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Click to filter</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleExpiringSoonFilter}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiringSoonItems}</div>
              <p className="text-xs text-muted-foreground">Click to filter</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleExpiredFilter}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{expiredItems}</div>
              <p className="text-xs text-muted-foreground">Click to filter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S${totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Show message if no data */}
        {inventory.length === 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-500" />
                No Inventory Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                No inventory items found in the database. Run the seeding script to populate with sample data.
              </p>
              <Button onClick={() => fetchInventory()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Critical Alerts - Simplified and Concise */}
        {inventory.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {inventory
                  .filter(item => {
                    const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
                    const stockPercentage = (item.quantity / item.maxStock) * 100
                    return daysToExpiry < 30 || stockPercentage < 25
                  })
                  .map((item) => {
                    const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
                    const stockPercentage = (item.quantity / item.maxStock) * 100
                    
                    // Determine alert type and message
                    let alertType = 'Good'
                    let alertMessage = ''
                    let alertColor = 'bg-green-50 border-green-200'
                    
                    if (daysToExpiry < 0) {
                      alertType = 'Expired'
                      alertMessage = `Expired: ${Math.abs(daysToExpiry)} days overdue`
                      alertColor = 'bg-red-50 border-red-200 hover:bg-red-100'
                    } else if (daysToExpiry <= 7) {
                      alertType = 'Critical'
                      alertMessage = `Expires: ${daysToExpiry}d left`
                      alertColor = 'bg-red-50 border-red-200 hover:bg-red-100'
                    } else if (daysToExpiry <= 30) {
                      alertType = 'Warning'
                      alertMessage = `Expiring Soon: ${daysToExpiry}d left`
                      alertColor = 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                    } else if (stockPercentage < 25) {
                      alertType = 'Low Stock'
                      alertMessage = `Low Stock: ${item.quantity}${item.unit} left`
                      alertColor = 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                    }

                    return (
                      <div
                        key={item._id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${alertColor}`}
                        onClick={(e) => handleRowClick(item.id, e)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">{item.item}</p>
                            <p className={`text-sm font-medium mt-1 ${
                              alertType === 'Expired' || alertType === 'Critical' 
                                ? 'text-red-600' 
                                : alertType === 'Warning' || alertType === 'Low Stock'
                                  ? 'text-amber-600'
                                  : 'text-green-600'
                            }`}>
                              {alertMessage}
                            </p>
                          </div>
                          <div className={`ml-2 h-3 w-3 rounded-full ${
                            alertType === 'Expired' || alertType === 'Critical' 
                              ? 'bg-red-500' 
                              : alertType === 'Warning' || alertType === 'Low Stock'
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`} />
                        </div>
                      </div>
                    )
                  })}
                  
                {/* No alerts message */}
                {inventory.filter(item => {
                  const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
                  const stockPercentage = (item.quantity / item.maxStock) * 100
                  return daysToExpiry < 30 || stockPercentage < 25
                }).length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                    <p className="text-gray-600 font-medium">All items are in good condition</p>
                    <p className="text-sm text-gray-500">No critical alerts at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        {inventory.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                {filteredInventory.length} of {inventory.length} items shown
                {getActiveFilterCount() > 0 &&
                  ` • ${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? "s" : ""} active`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filter Toggle */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by item name, category, location, supplier, or ID..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Popover open={showFilters} onOpenChange={setShowFilters}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="relative bg-transparent">
                          <SlidersHorizontal className="h-4 w-4 mr-2" />
                          Filters
                          {getActiveFilterCount() > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                              {getActiveFilterCount()}
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96" align="end">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Filters</h4>
                            {getActiveFilterCount() > 0 && (
                              <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-1" />
                                Clear All
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Category Filter */}
                            <div>
                              <label className="text-sm font-medium">Category</label>
                              <Select
                                value={filters.category}
                                onValueChange={(value) => handleFilterChange("category", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="All">All categories</SelectItem>
                                  {uniqueCategories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Status Filter */}
                            <div>
                              <label className="text-sm font-medium">Status</label>
                              <Select
                                value={filters.status}
                                onValueChange={(value) => handleFilterChange("status", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="All">All statuses</SelectItem>
                                  {uniqueStatuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Location Filter */}
                            <div>
                              <label className="text-sm font-medium">Location</label>
                              <Select
                                value={filters.location}
                                onValueChange={(value) => handleFilterChange("location", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="All locations" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="All">All locations</SelectItem>
                                  {uniqueLocations.map((location) => (
                                    <SelectItem key={location} value={location}>
                                      {location}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Supplier Filter */}
                            <div>
                              <label className="text-sm font-medium">Supplier</label>
                              <Select
                                value={filters.supplier}
                                onValueChange={(value) => handleFilterChange("supplier", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="All suppliers" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="All">All suppliers</SelectItem>
                                  {uniqueSuppliers.map((supplier) => (
                                    <SelectItem key={supplier} value={supplier}>
                                      {supplier}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Quantity Range */}
                          <div>
                            <label className="text-sm font-medium">Quantity Range</label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={filters.minQuantity}
                                onChange={(e) => handleFilterChange("minQuantity", e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Max"
                                value={filters.maxQuantity}
                                onChange={(e) => handleFilterChange("maxQuantity", e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Cost Range */}
                          <div>
                            <label className="text-sm font-medium">Cost per Unit Range (S$)</label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={filters.minCost}
                                onChange={(e) => handleFilterChange("minCost", e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Max"
                                value={filters.maxCost}
                                onChange={(e) => handleFilterChange("maxCost", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {getActiveFilterCount() > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {/* Active Filters Display */}
                {getActiveFilterCount() > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Search: "{searchTerm}"
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
                      </Badge>
                    )}
                    {Object.entries(filters).map(([key, value]) => {
                      if (!value || value === "All") return null
                      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
                      return (
                        <Badge key={key} variant="secondary" className="flex items-center gap-1">
                          {label}: {value}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleFilterChange(key as keyof Filters, "")}
                          />
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Table */}
        {inventory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Inventory Items</CardTitle>
              <CardDescription>
                Complete wood inventory with stock levels and expiry tracking (Click on any row to view details, or select multiple items for bulk editing)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInventory.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items match your filters</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Drag column headers to reorder</span>
                      <Button variant="outline" size="sm" onClick={resetColumnOrder} className="text-xs bg-transparent">
                        Reset Order
                      </Button>
                    </div>
                    <div>
                      {selectedItems.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleBulkEdit}
                          className="text-xs bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Bulk Edit ({selectedItems.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  <div id="inventory-table" className="rounded-md border bg-white">
                    <div className="overflow-auto max-h-[600px]">
                      <table className="w-full">
                        <thead className="bg-white sticky top-0 z-20 border-b border-gray-200">
                          <tr className="border-b border-gray-200">
                            {columnOrder.map((column, index) => (
                              <th
                                key={column.key}
                                className={`${column.width} ${column.key === 'select' ? 'cursor-default' : 'cursor-move'} select-none transition-colors bg-white p-3 text-left font-medium text-gray-900 border-b border-gray-200 ${
                                  dragOverColumn === index ? "bg-blue-100 border-l-2 border-blue-500" : ""
                                } ${draggedColumn === index ? "opacity-50" : ""}`}
                                style={{ 
                                  position: 'sticky', 
                                  top: 0, 
                                  backgroundColor: 'white', 
                                  zIndex: 20,
                                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                }}
                                draggable={column.key !== 'select'}
                                onDragStart={column.key !== 'select' ? (e) => handleDragStart(e, index) : undefined}
                                onDragEnd={column.key !== 'select' ? handleDragEnd : undefined}
                                onDragOver={column.key !== 'select' ? (e) => handleDragOver(e, index) : undefined}
                                onDragLeave={column.key !== 'select' ? handleDragLeave : undefined}
                                onDrop={column.key !== 'select' ? (e) => handleDrop(e, index) : undefined}
                              >
                                {column.key === 'select' ? (
                                  <Checkbox
                                    checked={selectedItems.length === paginatedInventory.length && paginatedInventory.length > 0}
                                    onCheckedChange={handleSelectAllItems}
                                  />
                                ) : (
                                  <div className={`flex items-center space-x-2 ${column.key === 'value' ? 'justify-end' : ''}`}>
                                    <span>{column.label}</span>
                                    <div className="flex flex-col space-y-0.5 opacity-50">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                    </div>
                                  </div>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedInventory.map((item) => (
                            <tr
                              key={item._id}
                              className={`cursor-pointer transition-colors group border-b border-gray-100 ${
                                selectedItems.includes(item.id) 
                                  ? "bg-blue-50 hover:bg-blue-100" 
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={(e) => handleRowClick(item.id, e)}
                            >
                              {columnOrder.map((column) => (
                                <td 
                                  key={`${item._id}-${column.key}`} 
                              className={`${column.width} ${column.key === 'value' ? 'text-right' : ''} py-4 px-4 align-top`}
                            >
                              {renderCellContent(item, column.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between px-2 py-4 border-t">
                    <div className="flex items-center space-x-4">
                      <p className="text-sm text-gray-700">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredInventory.length)} of {filteredInventory.length} items
                      </p>
                      {selectedItems.length > 0 && (
                        <p className="text-sm text-blue-600 font-medium">
                          {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Items per page</p>
                        <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                          <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent side="top">
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {/* Show pagination numbers */}
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                            if (pageNum <= totalPages) {
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNum)}
                                  className="w-8 h-8"
                                >
                                  {pageNum}
                                </Button>
                              )
                            }
                            return null
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Storage Locations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Storage Locations</CardTitle>
            <CardDescription>Warehouse capacity and utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Singapore Warehouse */}
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xl font-bold text-blue-900">Singapore Warehouse</div>
                    <div className="text-sm text-blue-700">Primary Distribution Hub</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">
                      {(() => {
                        const singaporeItems = inventory.filter(item => 
                          item.location === 'Singapore Warehouse'
                        )
                        const totalQuantity = singaporeItems.reduce((sum, item) => sum + item.quantity, 0)
                        const maxCapacity = singaporeItems.reduce((sum, item) => sum + item.maxStock, 0)
                        const percentage = maxCapacity > 0 ? (totalQuantity / maxCapacity) * 100 : 0
                        return `${Math.round(percentage)}%`
                      })()}
                    </div>
                    <div className="text-xs text-blue-600">Capacity</div>
                  </div>
                </div>
                
                <Progress 
                  value={(() => {
                    const singaporeItems = inventory.filter(item => 
                      item.location === 'Singapore Warehouse'
                    )
                    const totalQuantity = singaporeItems.reduce((sum, item) => sum + item.quantity, 0)
                    const maxCapacity = singaporeItems.reduce((sum, item) => sum + item.maxStock, 0)
                    return maxCapacity > 0 ? (totalQuantity / maxCapacity) * 100 : 0
                  })()} 
                  className="mt-3 h-3" 
                />
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-blue-700 font-medium">Current Stock</div>
                    <div className="text-blue-900">
                      {(() => {
                        const singaporeItems = inventory.filter(item => 
                          item.location === 'Singapore Warehouse'
                        )
                        return singaporeItems.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()
                      })()} m³
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-700 font-medium">Max Capacity</div>
                    <div className="text-blue-900">
                      {(() => {
                        const singaporeItems = inventory.filter(item => 
                          item.location === 'Singapore Warehouse'
                        )
                        return singaporeItems.reduce((sum, item) => sum + item.maxStock, 0).toLocaleString()
                      })()} m³
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-700 font-medium">Items Stored</div>
                    <div className="text-blue-900">
                      {(() => {
                        const singaporeItems = inventory.filter(item => 
                          item.location === 'Singapore Warehouse'
                        )
                        return singaporeItems.length
                      })()} items
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-700 font-medium">Total Value</div>
                    <div className="text-blue-900">
                      S${(() => {
                        const singaporeItems = inventory.filter(item => 
                          item.location === 'Singapore Warehouse'
                        )
                        return singaporeItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Malaysian Warehouse */}
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xl font-bold text-green-900">Malaysian Warehouse</div>
                    <div className="text-sm text-green-700">Regional Distribution Center</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-900">
                      {(() => {
                        const malaysianItems = inventory.filter(item => 
                          item.location === 'Malaysian Warehouse'
                        )
                        const totalQuantity = malaysianItems.reduce((sum, item) => sum + item.quantity, 0)
                        const maxCapacity = malaysianItems.reduce((sum, item) => sum + item.maxStock, 0)
                        const percentage = maxCapacity > 0 ? (totalQuantity / maxCapacity) * 100 : 0
                        return `${Math.round(percentage)}%`
                      })()}
                    </div>
                    <div className="text-xs text-green-600">Capacity</div>
                  </div>
                </div>
                
                <Progress 
                  value={(() => {
                    const malaysianItems = inventory.filter(item => 
                      item.location === 'Malaysian Warehouse'
                    )
                    const totalQuantity = malaysianItems.reduce((sum, item) => sum + item.quantity, 0)
                    const maxCapacity = malaysianItems.reduce((sum, item) => sum + item.maxStock, 0)
                    return maxCapacity > 0 ? (totalQuantity / maxCapacity) * 100 : 0
                  })()} 
                  className="mt-3 h-3" 
                />
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-green-700 font-medium">Current Stock</div>
                    <div className="text-green-900">
                      {(() => {
                        const malaysianItems = inventory.filter(item => 
                          item.location === 'Malaysian Warehouse'
                        )
                        return malaysianItems.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()
                      })()} m³
                    </div>
                  </div>
                  <div>
                    <div className="text-green-700 font-medium">Max Capacity</div>
                    <div className="text-green-900">
                      {(() => {
                        const malaysianItems = inventory.filter(item => 
                          item.location === 'Malaysian Warehouse'
                        )
                        return malaysianItems.reduce((sum, item) => sum + item.maxStock, 0).toLocaleString()
                      })()} m³
                    </div>
                  </div>
                  <div>
                    <div className="text-green-700 font-medium">Items Stored</div>
                    <div className="text-green-900">
                      {(() => {
                        const malaysianItems = inventory.filter(item => 
                          item.location === 'Malaysian Warehouse'
                        )
                        return malaysianItems.length
                      })()} items
                    </div>
                  </div>
                  <div>
                    <div className="text-green-700 font-medium">Total Value</div>
                    <div className="text-green-900">
                      S${(() => {
                        const malaysianItems = inventory.filter(item => 
                          item.location === 'Malaysian Warehouse'
                        )
                        return malaysianItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && deleteDialog.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>

            <div className="space-y-3 mb-6">
              <p>Are you sure you want to delete this item? This action cannot be undone.</p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Item ID:</span>
                  <span>{deleteDialog.item.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{deleteDialog.item.item}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Category:</span>
                  <span>{deleteDialog.item.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Current Stock:</span>
                  <span>
                    {deleteDialog.item.quantity} {deleteDialog.item.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Value:</span>
                  <span className="text-red-600 font-semibold">
                    S${(deleteDialog.item.quantity * deleteDialog.item.costPerUnit).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                This will permanently remove the item from your inventory database.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setDeleteDialog({ open: false, item: null })}
                disabled={deletingItem === deleteDialog.item.id}
                className="flex-1"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteItem(deleteDialog.item!)}
                disabled={deletingItem === deleteDialog.item.id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deletingItem === deleteDialog.item.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Item
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      <Dialog open={showBulkEditModal} onOpenChange={setShowBulkEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit Items</DialogTitle>
            <DialogDescription>
              Edit {selectedItems.length} selected item{selectedItems.length !== 1 ? 's' : ''}. Leave fields empty to keep current values.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-name">Item Name</Label>
              <Input
                id="bulk-name"
                placeholder="Enter new name (optional)"
                value={bulkEditData.name}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-location">Location</Label>
              <Select 
                value={bulkEditData.location} 
                onValueChange={(value) => setBulkEditData(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KEEP_CURRENT">Keep current location</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-quantity">Quantity</Label>
              <Input
                id="bulk-quantity"
                type="number"
                min="0"
                placeholder="Enter new quantity (optional)"
                value={bulkEditData.quantity}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowBulkEditModal(false)}
                disabled={isBulkUpdating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpdate}
                disabled={isBulkUpdating}
                className="flex-1"
              >
                {isBulkUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Update Items
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}
