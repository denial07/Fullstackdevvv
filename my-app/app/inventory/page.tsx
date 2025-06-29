import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Search, Filter, Download, Package, AlertTriangle, Clock, TrendingDown } from "lucide-react"
import Link from "next/link"

// Mock inventory data
const inventory = [
  {
    id: "INV-001",
    item: "Teak Wood Planks",
    category: "Hardwood",
    quantity: 45,
    unit: "m³",
    minStock: 50,
    maxStock: 200,
    location: "Warehouse A-1",
    receivedDate: "2023-12-15",
    expiryDate: "2024-02-15",
    supplier: "Malaysian Timber Co.",
    costPerUnit: 850,
    status: "Low Stock",
  },
  {
    id: "INV-002",
    item: "Pine Wood Boards",
    category: "Softwood",
    quantity: 12,
    unit: "m³",
    minStock: 30,
    maxStock: 150,
    location: "Warehouse B-2",
    receivedDate: "2023-11-20",
    expiryDate: "2024-01-20",
    supplier: "Indonesian Wood Supply",
    costPerUnit: 420,
    status: "Expiring Soon",
  },
  {
    id: "INV-003",
    item: "Oak Wood Sheets",
    category: "Hardwood",
    quantity: 8,
    unit: "m³",
    minStock: 25,
    maxStock: 100,
    location: "Warehouse A-3",
    receivedDate: "2023-10-10",
    expiryDate: "2024-01-10",
    supplier: "Thai Forest Products",
    costPerUnit: 920,
    status: "Expired",
  },
  {
    id: "INV-004",
    item: "Bamboo Planks",
    category: "Sustainable",
    quantity: 85,
    unit: "m³",
    minStock: 40,
    maxStock: 120,
    location: "Warehouse C-1",
    receivedDate: "2024-01-05",
    expiryDate: "2024-04-05",
    supplier: "Vietnamese Lumber Ltd.",
    costPerUnit: 320,
    status: "Good",
  },
  {
    id: "INV-005",
    item: "Mahogany Boards",
    category: "Hardwood",
    quantity: 32,
    unit: "m³",
    minStock: 20,
    maxStock: 80,
    location: "Warehouse A-2",
    receivedDate: "2023-12-20",
    expiryDate: "2024-03-20",
    supplier: "Malaysian Timber Co.",
    costPerUnit: 1150,
    status: "Good",
  },
  {
    id: "INV-006",
    item: "Plywood Sheets",
    category: "Engineered",
    quantity: 15,
    unit: "m³",
    minStock: 25,
    maxStock: 100,
    location: "Warehouse B-1",
    receivedDate: "2023-11-15",
    expiryDate: "2024-02-15",
    supplier: "Indonesian Wood Supply",
    costPerUnit: 380,
    status: "Low Stock",
  },
]

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
                    key={item.id}
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
                  <Input placeholder="Search by item name, category, or location..." className="pl-10" />
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
                  {inventory.map((item) => {
                    const stockPercentage = (item.quantity / item.maxStock) * 100
                    const daysToExpiry = getDaysUntilExpiry(item.expiryDate)

                    return (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <Link href={`/inventory/${item.id}`} className="text-blue-600 hover:text-blue-800">
                            {item.id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/inventory/${item.id}`} className="hover:text-blue-600">
                            {item.item}
                          </Link>
                        </TableCell>
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
