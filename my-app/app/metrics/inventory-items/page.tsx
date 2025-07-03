"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
    ArrowLeft,
    Search,
    Filter,
    Download,
    Package,
    AlertTriangle,
    Clock,
    TrendingDown,
    ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"

// Mock inventory data
const inventoryItems = [
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
        stockLevel: 22.5,
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
        stockLevel: 8,
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
        stockLevel: 8,
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
        stockLevel: 70.8,
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
        stockLevel: 40,
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
        stockLevel: 15,
    },
    {
        id: "INV-007",
        item: "Cedar Planks",
        category: "Softwood",
        quantity: 65,
        unit: "m³",
        minStock: 30,
        maxStock: 120,
        location: "Warehouse B-3",
        receivedDate: "2024-01-02",
        expiryDate: "2024-03-02",
        supplier: "Canadian Wood Co.",
        costPerUnit: 680,
        status: "Good",
        stockLevel: 54.2,
    },
    {
        id: "INV-008",
        item: "Birch Wood Sheets",
        category: "Hardwood",
        quantity: 28,
        unit: "m³",
        minStock: 35,
        maxStock: 90,
        location: "Warehouse A-4",
        receivedDate: "2023-12-28",
        expiryDate: "2024-02-28",
        supplier: "Nordic Timber Ltd.",
        costPerUnit: 750,
        status: "Low Stock",
        stockLevel: 31.1,
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

export default function InventoryItemsPage() {
    const totalItems = inventoryItems.length
    const lowStockItems = inventoryItems.filter((item) => item.status === "Low Stock").length
    const expiringSoonItems = inventoryItems.filter((item) => item.status === "Expiring Soon").length
    const expiredItems = inventoryItems.filter((item) => item.status === "Expired").length
    const goodItems = inventoryItems.filter((item) => item.status === "Good").length
    const totalValue = inventoryItems.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0)

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
                                <h1 className="text-3xl font-bold text-gray-900">Inventory Items</h1>
                                <p className="text-gray-600">Complete inventory overview with stock levels and status</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Button size="sm">Add Item</Button>
                            <UserNav />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Total Items</CardTitle>
                            <Package className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Good Stock</CardTitle>
                            <Package className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{goodItems}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Low Stock</CardTitle>
                            <TrendingDown className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{lowStockItems}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Critical Items</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{expiringSoonItems + expiredItems}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Total Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">S${totalValue.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Links */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-slate-900">Quick Navigation</CardTitle>
                        <CardDescription className="text-slate-600">Access detailed inventory management</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button asChild className="h-16 flex-col space-y-2 bg-blue-600 hover:bg-blue-700">
                                <Link href="/inventory">
                                    <Package className="h-6 w-6" />
                                    <span>View Full Inventory Management</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-16 flex-col space-y-2 bg-transparent">
                                <Link href="/inventory">
                                    <AlertTriangle className="h-6 w-6" />
                                    <span>Critical Alerts & Expiry Tracking</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Critical Alerts */}
                {(expiringSoonItems > 0 || expiredItems > 0) && (
                    <Card className="mb-6 border-red-200">
                        <CardHeader>
                            <CardTitle className="flex items-center text-red-700">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                Critical Inventory Alerts
                            </CardTitle>
                            <CardDescription className="text-slate-600">Items requiring immediate attention</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {inventoryItems
                                    .filter((item) => item.status === "Expired" || item.status === "Expiring Soon")
                                    .map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-3">
                                                {getStatusIcon(item.status)}
                                                <div>
                                                    <p className="font-medium text-slate-900">{item.item}</p>
                                                    <p className="text-sm text-slate-600">
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

                {/* Filters and Search */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-slate-900">Search & Filter</CardTitle>
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
                        <CardTitle className="text-slate-900">All Inventory Items</CardTitle>
                        <CardDescription className="text-slate-600">
                            Complete inventory with stock levels and expiry tracking
                        </CardDescription>
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
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead>Days to Expiry</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Value (S$)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventoryItems.map((item) => {
                                        const stockPercentage = (item.quantity / item.maxStock) * 100
                                        const daysToExpiry = getDaysUntilExpiry(item.expiryDate)

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium text-slate-900">{item.id}</TableCell>
                                                <TableCell className="text-slate-900">{item.item}</TableCell>
                                                <TableCell className="text-slate-700">{item.category}</TableCell>
                                                <TableCell className="text-slate-900">
                                                    {item.quantity} {item.unit}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <Progress value={stockPercentage} className="h-2" />
                                                        <div className="text-xs text-slate-500">
                                                            {item.quantity}/{item.maxStock} {item.unit}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-700">{item.location}</TableCell>
                                                <TableCell className="text-slate-700">{item.expiryDate}</TableCell>
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
                                                <TableCell className="text-slate-900">
                                                    {(item.quantity * item.costPerUnit).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-slate-900">Category Distribution</CardTitle>
                            <CardDescription className="text-slate-600">Items by wood category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Hardwood</span>
                                    <span className="text-sm font-medium text-slate-900">
                                        {inventoryItems.filter((item) => item.category === "Hardwood").length} items
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Softwood</span>
                                    <span className="text-sm font-medium text-slate-900">
                                        {inventoryItems.filter((item) => item.category === "Softwood").length} items
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Engineered</span>
                                    <span className="text-sm font-medium text-slate-900">
                                        {inventoryItems.filter((item) => item.category === "Engineered").length} items
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Sustainable</span>
                                    <span className="text-sm font-medium text-slate-900">
                                        {inventoryItems.filter((item) => item.category === "Sustainable").length} items
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-slate-900">Stock Health Summary</CardTitle>
                            <CardDescription className="text-slate-600">Overall inventory health metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Items in Good Stock</span>
                                    <span className="text-sm font-medium text-slate-900">{goodItems} items</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Items Below Minimum</span>
                                    <span className="text-sm font-medium text-slate-900">{lowStockItems} items</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Items Expiring Soon</span>
                                    <span className="text-sm font-medium text-slate-900">{expiringSoonItems} items</span>
                                </div>
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-700">Health Score</span>
                                        <span className="text-sm font-medium text-slate-900">
                                            {Math.round((goodItems / totalItems) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
