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

  // Add column configuration and drag-and-drop state
  const defaultColumns = [
    { key: "select", label: "", width: "w-12" },
    { key: "id", label: "Item ID", width: "w-24" },
    { key: "item", label: "Item Name", width: "w-40" },
    { key: "category", label: "Category", width: "w-28" },
    { key: "quantity", label: "Quantity (m³)", width: "w-32" },
    { key: "stockLevel", label: "Stock Level (m³)", width: "w-32" },
    { key: "location", label: "Location", width: "w-32" },
    { key: "receivedDate", label: "Received Date", width: "w-28" },
    { key: "expiryDate", label: "Expiry Date", width: "w-28" },
    { key: "daysToExpiry", label: "Days to Expiry", width: "w-36" },
    { key: "status", label: "Status", width: "w-40" },
    { key: "value", label: "Value (S$)", width: "w-28 text-right" },
    { key: "actions", label: "Actions", width: "w-20" },
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

    switch (columnKey) {
      case "select":
        return (
          <Checkbox
            checked={selectedItems.includes(item.id)}
            onCheckedChange={() => handleSelectItem(item.id)}
            onClick={(e) => e.stopPropagation()}
          />
        )
      case "id":
        return <span className="font-medium">{item.id}</span>
      case "item":
        return item.item
      case "category":
        return item.category
      case "quantity":
        return (
          <span className="font-medium">
            {item.quantity.toLocaleString()}
          </span>
        )
      case "stockLevel":
        return (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${getStockLevelColor(stockPercentage)}`}
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">
                  {stockPercentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-600 text-center">
              {item.quantity.toLocaleString()}/{item.maxStock.toLocaleString()}
            </div>
          </div>
        )
      case "location":
        return item.location
      case "receivedDate":
        return item.receivedDate
      case "expiryDate":
        return item.expiryDate
      case "daysToExpiry":
        const maxDays = 365 // Assume max reasonable expiry is 1 year for progress calculation
        const progressPercentage = daysToExpiry < 0 ? 0 : Math.min((daysToExpiry / maxDays) * 100, 100)
        
        return (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${getExpiryProgressColor(daysToExpiry)}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className={`text-xs text-center font-medium ${
              daysToExpiry < 0 
                ? "text-red-600" 
                : daysToExpiry < 30 
                  ? "text-orange-600" 
                  : daysToExpiry < 90
                    ? "text-yellow-600"
                    : "text-green-600"
            }`}>
              {daysToExpiry < 0 ? `${Math.abs(daysToExpiry)}d overdue` : `${daysToExpiry}d left`}
            </div>
          </div>
        )
      case "status":
        const statusBadge = getEnhancedStatusBadge(item)
        return (
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
              <span>{statusBadge.icon}</span>
              {statusBadge.text}
            </span>
          </div>
        )
      case "value":
        return (
          <span className="font-medium">
            {(item.quantity * item.costPerUnit).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </span>
        )
      case "actions":
        return (
          <div className="edit-controls flex items-center space-x-2">
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
  }, [selectedItems])

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

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((value) => value !== "").length + (debouncedSearchTerm ? 1 : 0)
  }, [filters, debouncedSearchTerm])

  // Keep the function for backward compatibility but use the memoized value
  const getActiveFilterCount = () => activeFilterCount

  // Bulk edit functions
  const handleSelectAllItems = () => {
    if (selectedItems.length === filteredInventory.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredInventory.map(item => item.id))
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiringSoonItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{expiredItems}</div>
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

        {/* Critical Alerts */}
        {inventory.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Critical Alerts
              </CardTitle>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inventory
                  .filter(item => {
                    const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
                    const stockPercentage = (item.quantity / item.maxStock) * 100
                    return daysToExpiry < 30 || stockPercentage < 20
                  })
                  .map((item) => {
                    const statusBadge = getEnhancedStatusBadge(item)
                    const daysToExpiry = getDaysUntilExpiry(item.expiryDate)
                    
                    return (
                      <div
                        key={item._id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          daysToExpiry < 0 
                            ? 'bg-red-50 border-red-200 hover:bg-red-100'
                            : daysToExpiry < 30 
                              ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        }`}
                        onClick={(e) => handleRowClick(item.id, e)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{statusBadge.icon}</span>
                          <div>
                            <p className="font-medium">{item.item}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity.toLocaleString()} m³ - Expires: {item.expiryDate}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                          <span>{statusBadge.icon}</span>
                          {statusBadge.text}
                        </span>
                      </div>
                    )
                  })}
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

                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columnOrder.map((column, index) => (
                          <TableHead
                            key={column.key}
                            className={`${column.width} ${column.key === 'select' ? 'cursor-default' : 'cursor-move'} select-none transition-colors ${
                              dragOverColumn === index ? "bg-blue-100 border-l-2 border-blue-500" : ""
                            } ${draggedColumn === index ? "opacity-50" : ""}`}
                            draggable={column.key !== 'select'}
                            onDragStart={column.key !== 'select' ? (e) => handleDragStart(e, index) : undefined}
                            onDragEnd={column.key !== 'select' ? handleDragEnd : undefined}
                            onDragOver={column.key !== 'select' ? (e) => handleDragOver(e, index) : undefined}
                            onDragLeave={column.key !== 'select' ? handleDragLeave : undefined}
                            onDrop={column.key !== 'select' ? (e) => handleDrop(e, index) : undefined}
                          >
                            {column.key === 'select' ? (
                              <Checkbox
                                checked={selectedItems.length === filteredInventory.length && filteredInventory.length > 0}
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
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item) => (
                        <TableRow
                          key={item._id}
                          className={`cursor-pointer transition-colors group ${
                            selectedItems.includes(item.id) 
                              ? "bg-blue-50 hover:bg-blue-100" 
                              : "hover:bg-gray-50"
                          }`}
                          onClick={(e) => handleRowClick(item.id, e)}
                        >
                          {columnOrder.map((column) => (
                            <TableCell 
                              key={`${item._id}-${column.key}`} 
                              className={`${column.width} ${column.key === 'value' ? 'text-right' : ''}`}
                            >
                              {renderCellContent(item, column.key)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-900">Warehouse A</div>
                <div className="text-sm text-blue-700">Hardwood Storage</div>
                <Progress value={75} className="mt-2 h-2" />
                <div className="text-xs text-blue-600 mt-1">75% Capacity</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-900">Warehouse B</div>
                <div className="text-sm text-green-700">Softwood & Engineered</div>
                <Progress value={45} className="mt-2 h-2" />
                <div className="text-xs text-green-600 mt-1">45% Capacity</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-900">Warehouse C</div>
                <div className="text-sm text-purple-700">Sustainable Materials</div>
                <Progress value={60} className="mt-2 h-2" />
                <div className="text-xs text-purple-600 mt-1">60% Capacity</div>
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
