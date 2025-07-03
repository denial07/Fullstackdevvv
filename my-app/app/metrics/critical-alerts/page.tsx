"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    ArrowLeft,
    Search,
    Filter,
    Download,
    AlertTriangle,
    DollarSign,
    Ship,
    Package,
    ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"

// Mock critical alerts data
const criticalAlerts = [
    {
        id: "ALERT-001",
        type: "Inventory",
        category: "Expired",
        title: "Oak Wood Sheets Expired",
        description: "8 m³ of Oak Wood Sheets have expired and need immediate disposal",
        itemId: "INV-003",
        severity: "Critical",
        dateCreated: "2024-01-10",
        daysOverdue: 5,
        value: 7360,
        location: "Warehouse A-3",
        action: "Dispose/Replace",
    },
    {
        id: "ALERT-002",
        type: "Inventory",
        category: "Expiring Soon",
        title: "Pine Wood Boards Expiring",
        description: "12 m³ of Pine Wood Boards will expire in 5 days",
        itemId: "INV-002",
        severity: "High",
        dateCreated: "2024-01-15",
        daysOverdue: 0,
        value: 5040,
        location: "Warehouse B-2",
        action: "Use/Sell Urgently",
    },
    {
        id: "ALERT-003",
        type: "Inventory",
        category: "Low Stock",
        title: "Teak Wood Planks Low Stock",
        description: "Only 45 m³ remaining, below minimum threshold of 50 m³",
        itemId: "INV-001",
        severity: "Medium",
        dateCreated: "2024-01-12",
        daysOverdue: 0,
        value: 38250,
        location: "Warehouse A-1",
        action: "Reorder Immediately",
    },
    {
        id: "ALERT-004",
        type: "Shipment",
        category: "Delayed",
        title: "Indonesian Wood Supply Delayed",
        description: "Pine Wood shipment delayed by 3 days, affecting production schedule",
        itemId: "SH-IN-002",
        severity: "High",
        dateCreated: "2024-01-12",
        daysOverdue: 3,
        value: 22000,
        location: "In Transit",
        action: "Contact Vendor",
    },
    {
        id: "ALERT-005",
        type: "Payment",
        category: "Overdue",
        title: "Port Authority Payment Overdue",
        description: "S$22,000 payment overdue by 7 days from Port Authority Singapore",
        itemId: "ORD-005",
        severity: "Critical",
        dateCreated: "2024-01-11",
        daysOverdue: 7,
        value: 22000,
        location: "N/A",
        action: "Send Final Notice",
    },
    {
        id: "ALERT-006",
        type: "Inventory",
        category: "Low Stock",
        title: "Plywood Sheets Low Stock",
        description: "Only 15 m³ remaining, below minimum threshold of 25 m³",
        itemId: "INV-006",
        severity: "Medium",
        dateCreated: "2024-01-14",
        daysOverdue: 0,
        value: 5700,
        location: "Warehouse B-1",
        action: "Reorder Soon",
    },
    {
        id: "ALERT-007",
        type: "Shipment",
        category: "Delayed",
        title: "Thai Forest Products Delayed",
        description: "Mahogany shipment delayed by 2 days due to customs issues",
        itemId: "SH-IN-004",
        severity: "Medium",
        dateCreated: "2024-01-16",
        daysOverdue: 2,
        value: 19500,
        location: "Customs",
        action: "Follow Up",
    },
    {
        id: "ALERT-008",
        type: "Payment",
        category: "Pending",
        title: "Multiple Pending Payments",
        description: "3 orders with pending payments totaling S$27,025",
        itemId: "Multiple",
        severity: "Medium",
        dateCreated: "2024-01-15",
        daysOverdue: 0,
        value: 27025,
        location: "N/A",
        action: "Send Reminders",
    },
]

const getSeverityColor = (severity: string) => {
    switch (severity) {
        case "Critical":
            return "destructive"
        case "High":
            return "destructive"
        case "Medium":
            return "secondary"
        default:
            return "outline"
    }
}

const getTypeColor = (type: string) => {
    switch (type) {
        case "Inventory":
            return "bg-blue-100 text-blue-800"
        case "Shipment":
            return "bg-green-100 text-green-800"
        case "Payment":
            return "bg-red-100 text-red-800"
        default:
            return "bg-gray-100 text-gray-800"
    }
}

const getTypeIcon = (type: string) => {
    switch (type) {
        case "Inventory":
            return <Package className="h-4 w-4" />
        case "Shipment":
            return <Ship className="h-4 w-4" />
        case "Payment":
            return <DollarSign className="h-4 w-4" />
        default:
            return <AlertTriangle className="h-4 w-4" />
    }
}

export default function CriticalAlertsPage() {
    const totalAlerts = criticalAlerts.length
    const criticalAlerts_count = criticalAlerts.filter((alert) => alert.severity === "Critical").length
    const highAlerts = criticalAlerts.filter((alert) => alert.severity === "High").length
    const inventoryAlerts = criticalAlerts.filter((alert) => alert.type === "Inventory").length
    const shipmentAlerts = criticalAlerts.filter((alert) => alert.type === "Shipment").length
    const paymentAlerts = criticalAlerts.filter((alert) => alert.type === "Payment").length
    const totalValue = criticalAlerts.reduce((sum, alert) => sum + alert.value, 0)

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
                                <h1 className="text-3xl font-bold text-gray-900">Critical Alerts</h1>
                                <p className="text-gray-600">System alerts requiring immediate attention</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export Alerts
                            </Button>
                            <Button size="sm">Mark All Read</Button>
                            <UserNav />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Total Alerts</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{totalAlerts}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Critical</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{criticalAlerts_count}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Inventory</CardTitle>
                            <Package className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{inventoryAlerts}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Shipments</CardTitle>
                            <Ship className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{shipmentAlerts}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Payments</CardTitle>
                            <DollarSign className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{paymentAlerts}</div>
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
                        <CardDescription className="text-slate-600">Access related management sections</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button asChild className="h-16 flex-col space-y-2 bg-blue-600 hover:bg-blue-700">
                                <Link href="/inventory">
                                    <Package className="h-6 w-6" />
                                    <span>Inventory Management</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-16 flex-col space-y-2 bg-transparent">
                                <Link href="/shipments">
                                    <Ship className="h-6 w-6" />
                                    <span>Shipment Tracking</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-16 flex-col space-y-2 bg-transparent">
                                <Link href="/orders">
                                    <DollarSign className="h-6 w-6" />
                                    <span>Payment Management</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Critical Alerts Section */}
                <Card className="mb-6 border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center text-red-700">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Immediate Action Required
                        </CardTitle>
                        <CardDescription className="text-slate-600">Critical and high priority alerts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {criticalAlerts
                                .filter((alert) => alert.severity === "Critical" || alert.severity === "High")
                                .map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`flex items-center justify-between p-4 rounded-lg border ${alert.severity === "Critical" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon(alert.type)}
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-slate-900">{alert.title}</span>
                                                    <Badge className={getTypeColor(alert.type)}>{alert.type}</Badge>
                                                    <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                                                </div>
                                                <p className="text-sm text-slate-600">{alert.description}</p>
                                                <p className="text-xs text-slate-500">
                                                    {alert.daysOverdue > 0
                                                        ? `${alert.daysOverdue} days overdue`
                                                        : `Created: ${alert.dateCreated}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-slate-900">S${alert.value.toLocaleString()}</p>
                                            <Button size="sm" className="mt-1">
                                                {alert.action}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

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
                                    <Input placeholder="Search by alert title, type, or item ID..." className="pl-10" />
                                </div>
                            </div>
                            <Button variant="outline">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* All Alerts Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-slate-900">All Critical Alerts</CardTitle>
                        <CardDescription className="text-slate-600">
                            Complete list of system alerts requiring attention
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Alert ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>Date Created</TableHead>
                                        <TableHead>Days Overdue</TableHead>
                                        <TableHead>Value (S$)</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {criticalAlerts.map((alert) => (
                                        <TableRow key={alert.id}>
                                            <TableCell className="font-medium text-slate-900">{alert.id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    {getTypeIcon(alert.type)}
                                                    <Badge className={getTypeColor(alert.type)}>{alert.type}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-900">{alert.title}</TableCell>
                                            <TableCell className="max-w-xs truncate text-slate-700">{alert.description}</TableCell>
                                            <TableCell>
                                                <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-700">{alert.dateCreated}</TableCell>
                                            <TableCell>
                                                {alert.daysOverdue > 0 ? (
                                                    <span className="text-red-600 font-medium">{alert.daysOverdue} days</span>
                                                ) : (
                                                    <span className="text-green-600">On time</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-900">{alert.value.toLocaleString()}</TableCell>
                                            <TableCell className="text-slate-700">{alert.location}</TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline">
                                                    {alert.action}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Alert Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-slate-900">Alert Distribution</CardTitle>
                            <CardDescription className="text-slate-600">Breakdown by type and severity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Inventory Alerts</span>
                                    <span className="text-sm font-medium text-slate-900">{inventoryAlerts} alerts</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Shipment Alerts</span>
                                    <span className="text-sm font-medium text-slate-900">{shipmentAlerts} alerts</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Payment Alerts</span>
                                    <span className="text-sm font-medium text-slate-900">{paymentAlerts} alerts</span>
                                </div>
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-700">Critical/High Priority</span>
                                        <span className="text-sm font-medium text-slate-900">
                                            {criticalAlerts_count + highAlerts} alerts
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-slate-900">Financial Impact</CardTitle>
                            <CardDescription className="text-slate-600">Value at risk from alerts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Inventory Value at Risk</span>
                                    <span className="text-sm font-medium text-slate-900">
                                        S$
                                        {criticalAlerts
                                            .filter((a) => a.type === "Inventory")
                                            .reduce((sum, a) => sum + a.value, 0)
                                            .toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Delayed Shipment Value</span>
                                    <span className="text-sm font-medium text-slate-900">
                                        S$
                                        {criticalAlerts
                                            .filter((a) => a.type === "Shipment")
                                            .reduce((sum, a) => sum + a.value, 0)
                                            .toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Outstanding Payments</span>
                                    <span className="text-sm font-medium text-slate-900">
                                        S$
                                        {criticalAlerts
                                            .filter((a) => a.type === "Payment")
                                            .reduce((sum, a) => sum + a.value, 0)
                                            .toLocaleString()}
                                    </span>
                                </div>
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-700">Total Value at Risk</span>
                                        <span className="text-sm font-medium text-slate-900">S${totalValue.toLocaleString()}</span>
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
