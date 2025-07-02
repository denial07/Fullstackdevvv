"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Search, Filter, Download, Package, AlertTriangle, Clock, TrendingDown, Loader2 } from "lucide-react"
import Link from "next/link"

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

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/inventory")
      if (!response.ok) {
        throw new Error("Failed to fetch inventory")
      }
      const data = await response.json()
      setInventory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventory.filter(
    (item) =>
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading inventory...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchInventory}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalItems = inventory.length
  const lowStockItems = inventory.filter((item) => item.status === "Low Stock").length
  const expiringSoonItems = inventory.filter((item) => item.status === "Expiring Soon").length
  const expiredItems = inventory.filter((item) => item.status === "Expired").length
  const totalValue = inventory.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0)

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

        {/* Critical Alerts */}
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
                .filter((item) => item.status === "Expired" || item.status === "Expiring Soon")
                .map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
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

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by item name, category, or location..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Inventory Items</CardTitle>
            <CardDescription>Complete wood inventory with stock levels and expiry tracking</CardDescription>
          </CardHeader>
          <CardContent>
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
                      <TableRow key={item._id}>
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
          </CardContent>
        </Card>

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
