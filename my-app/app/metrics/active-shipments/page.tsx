"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Search, Filter, Download, Ship, Clock, AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"

// Mock active shipments data
const activeShipments = [
    {
        id: "SH-IN-001",
        type: "Incoming",
        vendor: "Malaysian Timber Co.",
        status: "In Transit",
        shippingDate: "2024-01-05",
        expectedArrival: "2024-01-15",
        actualArrival: null,
        value: 15000,
        delay: 0,
        items: "Teak Wood Planks - 50m³",
        trackingNumber: "MT2024001",
        vessel: "MV Timber Express",
        progress: 65,
    },
    {
        id: "SH-IN-002",
        type: "Incoming",
        vendor: "Indonesian Wood Supply",
        status: "Delayed",
        shippingDate: "2024-01-02",
        expectedArrival: "2024-01-12",
        actualArrival: null,
        value: 22000,
        delay: 3,
        items: "Pine Wood Boards - 75m³",
        trackingNumber: "IWS2024002",
        vessel: "MV Pine Carrier",
        progress: 80,
    },
    {
        id: "SH-OUT-001",
        type: "Outgoing",
        customer: "ABC Logistics Pte Ltd",
        status: "In Transit",
        shippingDate: "2024-01-12",
        expectedDelivery: "2024-01-14",
        actualDelivery: null,
        value: 8900,
        delay: 0,
        items: "Heavy Duty Pallets x 200",
        trackingNumber: "SPW2024002",
        driver: "Raj Kumar",
        progress: 45,
    },
    {
        id: "SH-OUT-002",
        type: "Outgoing",
        customer: "Singapore Shipping Co.",
        status: "Loading",
        shippingDate: "2024-01-14",
        expectedDelivery: "2024-01-15",
        actualDelivery: null,
        value: 12500,
        delay: 0,
        items: "Standard Pallets x 500",
        trackingNumber: "SPW2024003",
        driver: "Ahmad Rahman",
        progress: 25,
    },
    {
        id: "SH-IN-003",
        type: "Incoming",
        vendor: "Vietnamese Lumber Ltd.",
        status: "Customs Clearance",
        shippingDate: "2024-01-10",
        expectedArrival: "2024-01-20",
        actualArrival: "2024-01-20",
        value: 16800,
        delay: 0,
        items: "Bamboo Planks - 60m³",
        trackingNumber: "VLL2024004",
        vessel: "MV Bamboo Express",
        progress: 90,
    },
    {
        id: "SH-OUT-003",
        type: "Outgoing",
        customer: "Maritime Solutions Ltd",
        status: "Preparing",
        shippingDate: "2024-01-16",
        expectedDelivery: "2024-01-17",
        actualDelivery: null,
        value: 6750,
        delay: 0,
        items: "Custom Pallets x 150",
        trackingNumber: "SPW2024004",
        driver: "TBD",
        progress: 15,
    },
    {
        id: "SH-IN-004",
        type: "Incoming",
        vendor: "Thai Forest Products",
        status: "Delayed",
        shippingDate: "2024-01-08",
        expectedArrival: "2024-01-18",
        actualArrival: null,
        value: 19500,
        delay: 2,
        items: "Mahogany Boards - 45m³",
        trackingNumber: "TFP2024005",
        vessel: "MV Mahogany Star",
        progress: 70,
    },
    {
        id: "SH-OUT-004",
        type: "Outgoing",
        customer: "Port Authority Singapore",
        status: "Scheduled",
        shippingDate: "2024-01-18",
        expectedDelivery: "2024-01-19",
        actualDelivery: null,
        value: 22000,
        delay: 0,
        items: "Industrial Pallets x 600",
        trackingNumber: "SPW2024005",
        driver: "Wei Ming",
        progress: 10,
    },
]

const getStatusColor = (status: string) => {
    switch (status) {
        case "In Transit":
            return "default"
        case "Delayed":
            return "destructive"
        case "Loading":
            return "secondary"
        case "Preparing":
            return "outline"
        case "Scheduled":
            return "outline"
        case "Customs Clearance":
            return "secondary"
        default:
            return "secondary"
    }
}

const getTypeColor = (type: string) => {
    return type === "Incoming" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
}

export default function ActiveShipmentsPage() {
    const totalValue = activeShipments.reduce((sum, shipment) => sum + shipment.value, 0)
    const delayedShipments = activeShipments.filter((s) => s.status === "Delayed").length
    const inTransitShipments = activeShipments.filter((s) => s.status === "In Transit").length
    const incomingShipments = activeShipments.filter((s) => s.type === "Incoming").length
    const outgoingShipments = activeShipments.filter((s) => s.type === "Outgoing").length

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
                                <h1 className="text-3xl font-bold text-gray-900">Active Shipments</h1>
                                <p className="text-gray-600">Currently active incoming and outgoing shipments</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Button size="sm">Add Shipment</Button>
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
                            <CardTitle className="text-sm font-medium text-slate-900">Total Active</CardTitle>
                            <Ship className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{activeShipments.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">In Transit</CardTitle>
                            <Clock className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{inTransitShipments}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Delayed</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{delayedShipments}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Incoming</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{incomingShipments}</div>
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
                        <CardDescription className="text-slate-600">Access detailed shipment sections</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button asChild className="h-16 flex-col space-y-2 bg-blue-600 hover:bg-blue-700">
                                <Link href="/shipments">
                                    <Ship className="h-6 w-6" />
                                    <span>View All Shipments</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-16 flex-col space-y-2 bg-transparent">
                                <Link href="/shipments/incoming">
                                    <Ship className="h-6 w-6" />
                                    <span>Incoming Shipments</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-16 flex-col space-y-2 bg-transparent">
                                <Link href="/shipments/outgoing">
                                    <Ship className="h-6 w-6" />
                                    <span>Outgoing Shipments</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
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
                                    <Input
                                        placeholder="Search by shipment ID, vendor, customer, or tracking number..."
                                        className="pl-10"
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

                {/* Active Shipments Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-slate-900">All Active Shipments</CardTitle>
                        <CardDescription className="text-slate-600">
                            Currently active incoming and outgoing shipments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Shipment ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Vendor/Customer</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Expected Date</TableHead>
                                        <TableHead>Value (S$)</TableHead>
                                        <TableHead>Delay</TableHead>
                                        <TableHead>Tracking</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeShipments.map((shipment) => (
                                        <TableRow key={shipment.id}>
                                            <TableCell className="font-medium text-slate-900">{shipment.id}</TableCell>
                                            <TableCell>
                                                <Badge className={getTypeColor(shipment.type)}>{shipment.type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-900">
                                                {shipment.type === "Incoming" ? shipment.vendor : shipment.customer}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusColor(shipment.status)}>{shipment.status}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-slate-700">{shipment.items}</TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Progress value={shipment.progress} className="h-2" />
                                                    <div className="text-xs text-slate-500">{shipment.progress}%</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-700">
                                                {shipment.type === "Incoming" ? shipment.expectedArrival : shipment.expectedDelivery}
                                            </TableCell>
                                            <TableCell className="text-slate-900">{shipment.value.toLocaleString()}</TableCell>
                                            <TableCell>
                                                {shipment.delay > 0 ? (
                                                    <span className="text-red-600 font-medium">{shipment.delay} days</span>
                                                ) : (
                                                    <span className="text-green-600">On time</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-600">{shipment.trackingNumber}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-slate-900">Status Breakdown</CardTitle>
                            <CardDescription className="text-slate-600">Distribution of shipment statuses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">In Transit</span>
                                    <span className="text-sm font-medium text-slate-900">{inTransitShipments} shipments</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Delayed</span>
                                    <span className="text-sm font-medium text-slate-900">{delayedShipments} shipments</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Loading/Preparing</span>
                                    <span className="text-sm font-medium text-slate-900">
                                        {activeShipments.filter((s) => ["Loading", "Preparing"].includes(s.status)).length} shipments
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Customs Clearance</span>
                                    <span className="text-sm font-medium text-slate-900">
                                        {activeShipments.filter((s) => s.status === "Customs Clearance").length} shipments
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-slate-900">Type Distribution</CardTitle>
                            <CardDescription className="text-slate-600">Incoming vs outgoing shipments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Incoming Shipments</span>
                                    <span className="text-sm font-medium text-slate-900">{incomingShipments} shipments</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700">Outgoing Shipments</span>
                                    <span className="text-sm font-medium text-slate-900">{outgoingShipments} shipments</span>
                                </div>
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-700">Total Active Value</span>
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
