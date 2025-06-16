import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Search, Filter, Download, Ship, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

// Mock incoming shipment data
const incomingShipments = [
    {
        id: "SH-IN-001",
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
        port: "Port of Singapore",
    },
    {
        id: "SH-IN-002",
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
        port: "Port of Singapore",
    },
    {
        id: "SH-IN-003",
        vendor: "Thai Forest Products",
        status: "Arrived",
        shippingDate: "2023-12-28",
        expectedArrival: "2024-01-08",
        actualArrival: "2024-01-08",
        value: 18500,
        delay: 0,
        items: "Oak Wood Sheets - 40m³",
        trackingNumber: "TFP2024003",
        vessel: "MV Oak Transporter",
        port: "Port of Singapore",
    },
    {
        id: "SH-IN-004",
        vendor: "Vietnamese Lumber Ltd.",
        status: "Processing",
        shippingDate: "2024-01-18",
        expectedArrival: "2024-01-28",
        actualArrival: null,
        value: 19500,
        delay: 0,
        items: "Bamboo Planks - 60m³",
        trackingNumber: "VLL2024004",
        vessel: "MV Bamboo Express",
        port: "Port of Singapore",
    },
    {
        id: "SH-IN-005",
        vendor: "Malaysian Timber Co.",
        status: "Customs Clearance",
        shippingDate: "2024-01-10",
        expectedArrival: "2024-01-20",
        actualArrival: "2024-01-20",
        value: 16800,
        delay: 0,
        items: "Mahogany Boards - 35m³",
        trackingNumber: "MT2024005",
        vessel: "MV Mahogany Star",
        port: "Port of Singapore",
    },
]

const getStatusColor = (status: string) => {
    switch (status) {
        case "Arrived":
            return "default"
        case "In Transit":
            return "secondary"
        case "Delayed":
            return "destructive"
        case "Processing":
            return "outline"
        case "Customs Clearance":
            return "secondary"
        default:
            return "secondary"
    }
}

export default function IncomingShipmentsPage() {
    const totalValue = incomingShipments.reduce((sum, shipment) => sum + shipment.value, 0)
    const delayedShipments = incomingShipments.filter((s) => s.status === "Delayed").length
    const inTransitShipments = incomingShipments.filter((s) => s.status === "In Transit").length
    const arrivedShipments = incomingShipments.filter((s) => s.status === "Arrived").length

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-6">
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/shipments">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Shipments
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Incoming Shipments</h1>
                                <p className="text-gray-600">Raw material shipments from overseas vendors</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Button size="sm">Add Incoming Shipment</Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Incoming</CardTitle>
                            <Ship className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{incomingShipments.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inTransitShipments}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{delayedShipments}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Arrived</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{arrivedShipments}</div>
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
                                    <Input placeholder="Search by shipment ID, vendor, or tracking number..." className="pl-10" />
                                </div>
                            </div>
                            <Button variant="outline">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Incoming Shipments Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Incoming Shipments</CardTitle>
                        <CardDescription>Raw material shipments from overseas vendors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Shipment ID</TableHead>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Vessel</TableHead>
                                        <TableHead>Shipping Date</TableHead>
                                        <TableHead>Expected Arrival</TableHead>
                                        <TableHead>Actual Arrival</TableHead>
                                        <TableHead>Value (S$)</TableHead>
                                        <TableHead>Delay (Days)</TableHead>
                                        <TableHead>Tracking</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incomingShipments.map((shipment) => (
                                        <TableRow key={shipment.id}>
                                            <TableCell className="font-medium">{shipment.id}</TableCell>
                                            <TableCell>{shipment.vendor}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusColor(shipment.status)}>{shipment.status}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">{shipment.items}</TableCell>
                                            <TableCell className="text-sm">{shipment.vessel}</TableCell>
                                            <TableCell>{shipment.shippingDate}</TableCell>
                                            <TableCell>{shipment.expectedArrival}</TableCell>
                                            <TableCell>{shipment.actualArrival || "-"}</TableCell>
                                            <TableCell>{shipment.value.toLocaleString()}</TableCell>
                                            <TableCell>
                                                {shipment.delay > 0 ? (
                                                    <span className="text-red-600 font-medium">{shipment.delay}</span>
                                                ) : (
                                                    <span className="text-green-600">0</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{shipment.trackingNumber}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* AI Email Processing Info */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>AI Email Processing - Incoming Shipments</CardTitle>
                        <CardDescription>Automated extraction of shipment data from vendor emails</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">18</div>
                                <div className="text-sm text-blue-800">Vendor Emails Today</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">16</div>
                                <div className="text-sm text-green-800">Successfully Processed</div>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-600">2</div>
                                <div className="text-sm text-yellow-800">Require Manual Review</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">98%</div>
                                <div className="text-sm text-purple-800">Accuracy Rate</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
