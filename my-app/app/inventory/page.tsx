"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ArrowLeft,
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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
  const [searchTerm, setSearchTerm] = useState("")
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
  const router = useRouter()

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Fetching inventory directly...")
      const response = await fetch("/api/inventory")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`${errorData.error}: ${errorData.details || ""}`)
      }

      const data = await response.json()

      if (data.isEmpty) {
        setError("No inventory data found. Please run the seeding script to populate the database.")
        setInventory([])
      } else {
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
  }

  const handleRowClick = (itemId: string) => {
    router.push(`/inventory/${itemId}`)
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
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
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((value) => value !== "").length + (searchTerm ? 1 : 0)
  }

  // Get unique values for filter dropdowns
  const uniqueCategories = [...new Set(inventory.map((item) => item.category))].sort()
  const uniqueStatuses = [...new Set(inventory.map((item) => item.status))].sort()
  const uniqueLocations = [...new Set(inventory.map((item) => item.location))].sort()
  const uniqueSuppliers = [...new Set(inventory.map((item) => item.supplier))].sort()

  const filteredInventory = inventory.filter((item) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())

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

  const totalItems = inventory.length
  const lowStockItems = inventory.filter((item) => item.status?.trim().toLowerCase() === "low stock").length
  const expiringSoonItems = inventory.filter((item) => item.status?.trim().toLowerCase() === "expiring soon").length
  const expiredItems = inventory.filter((item) => item.status?.trim().toLowerCase() === "expired").length
  const totalValue = inventory.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0)

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

            <Button onClick={fetchInventory} className="w-full">
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-gray-600">Track wood inventory and expiry dates</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">Add Item</Button>
            </div>
          </div>
        </div>
      </header>

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
              <Button onClick={fetchInventory}>
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
                  .filter(
                    (item) =>
                      item.status?.trim().toLowerCase() === "expired" ||
                      item.status?.trim().toLowerCase() === "expiring soon",
                  )
                  .map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() => handleRowClick(item.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <p className="font-medium">{item.item}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} {item.unit} - Expires: {item.expiryDate}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
                    </div>
                  ))}
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
                Complete wood inventory with stock levels and expiry tracking (Click on any row to view details)
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item ID</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Stock Level</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Received Date</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Days to Expiry</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Value (S$)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item) => {
                        const stockPercentage = (item.quantity / item.maxStock) * 100
                        const daysToExpiry = getDaysUntilExpiry(item.expiryDate)

                        return (
                          <TableRow
                            key={item._id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleRowClick(item.id)}
                          >
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{item.item}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Progress value={stockPercentage} className="h-2" />
                                <div className="text-xs text-gray-500">
                                  {item.quantity}/{item.maxStock} {item.unit}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{item.receivedDate}</TableCell>
                            <TableCell>{item.expiryDate}</TableCell>
                            <TableCell>
                              <span
                                className={
                                  daysToExpiry < 0
                                    ? "text-red-600 font-medium"
                                    : daysToExpiry < 30
                                      ? "text-orange-600 font-medium"
                                      : "text-green-600"
                                }
                              >
                                {daysToExpiry < 0 ? `${Math.abs(daysToExpiry)} days overdue` : `${daysToExpiry} days`}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(item.status)}
                                <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>{(item.quantity * item.costPerUnit).toLocaleString()}</TableCell>
                          </TableRow>
                        )
                      })}
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
    </div>
  )
}
