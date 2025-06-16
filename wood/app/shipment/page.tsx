import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Package, Ship, TrendingDown, Clock, DollarSign, ShoppingCart } from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const shipmentSummary = {
    total: 24,
    inTransit: 8,
    delayed: 3,
    arrived: 13,
    totalValue: 245000,
}

const inventorySummary = {
    totalItems: 156,
    lowStock: 12,
    expiringSoon: 8,
    expired: 2,
    totalValue: 89000,
}

const ordersSummary = {
    total: 42,
    pending: 8,
    paid: 28,
    shipped: 24,
    delivered: 18,
    totalValue: 156000,
}

const recentShipments = [
    {
        id: "SH-001",
        vendor: "Malaysian Timber Co.",
        status: "In Transit",
        expectedArrival: "2024-01-15",
        value: 15000,
        delay: 0,
    },
    {
        id: "SH-002",
        vendor: "Indonesian Wood Supply",
        status: "Delayed",
        expectedArrival: "2024-01-12",
        value: 22000,
        delay: 3,
    },
    {
        id: "SH-003",
        vendor: "Thai Forest Products",
        status: "Arrived",
        expectedArrival: "2024-01-08",
        value: 18500,
        delay: 0,
    },
]

const criticalInventory = [
    {
        id: "INV-001",
        item: "Teak Wood Planks",
        quantity: 45,
        unit: "m³",
        expiryDate: "2024-02-15",
        status: "Low Stock",
    },
    {
        id: "INV-002",
        item: "Pine Wood Boards",
        quantity: 12,
        unit: "m³",
        expiryDate: "2024-01-20",
        status: "Expiring Soon",
    },
    {
        id: "INV-003",
        item: "Oak Wood Sheets",
        quantity: 8,
        unit: "m³",
        expiryDate: "2024-01-10",
        status: "Expired",
    },
]

const recentOrders = [
    {
        id: "ORD-001",
        customer: "ABC Logistics Pte Ltd",
        items: "Standard Pallets x 500",
        value: 12500,
        paymentStatus: "Paid",
        shippingStatus: "Shipped",
        orderDate: "2024-01-10",
    },
    {
        id: "ORD-002",
        customer: "Singapore Shipping Co.",
        items: "Heavy Duty Pallets x 200",
        value: 8900,
        paymentStatus: "Pending",
        shippingStatus: "Processing",
        orderDate: "2024-01-12",
    },
    {
        id: "ORD-003",
        customer: "Maritime Solutions Ltd",
        items: "Custom Pallets x 150",
        value: 6750,
        paymentStatus: "Paid",
        shippingStatus: "Delivered",
        orderDate: "2024-01-08",
    },
]

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Singapore Pallet Works</h1>
                            <p className="text-gray-600">Shipment, Inventory & Order Management Dashboard</p>
                        </div>
                        <div className="flex space-x-4">
                            <Button asChild>
                                <Link href="/shipments">Shipments</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/inventory">Inventory</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/orders">Orders</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
                            <Ship className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{shipmentSummary.inTransit}</div>
                            <p className="text-xs text-muted-foreground">{shipmentSummary.delayed} delayed</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inventorySummary.totalItems}</div>
                            <p className="text-xs text-muted-foreground">{inventorySummary.lowStock} low stock</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{ordersSummary.total}</div>
                            <p className="text-xs text-muted-foreground">{ordersSummary.pending} pending payment</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">S${ordersSummary.totalValue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">+12% from last month</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inventorySummary.expiringSoon + inventorySummary.expired}</div>
                            <p className="text-xs text-muted-foreground">Items need attention</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="shipments">Recent Shipments</TabsTrigger>
                        <TabsTrigger value="inventory">Critical Inventory</TabsTrigger>
                        <TabsTrigger value="orders">Recent Orders</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Shipment Status Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Shipment Status</CardTitle>
                                    <CardDescription>Current status of all shipments</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">In Transit</span>
                                            <span className="text-sm font-medium">{shipmentSummary.inTransit}</span>
                                        </div>
                                        <Progress value={(shipmentSummary.inTransit / shipmentSummary.total) * 100} className="h-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Delayed</span>
                                            <span className="text-sm font-medium">{shipmentSummary.delayed}</span>
                                        </div>
                                        <Progress
                                            value={(shipmentSummary.delayed / shipmentSummary.total) * 100}
                                            className="h-2 bg-red-100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Arrived</span>
                                            <span className="text-sm font-medium">{shipmentSummary.arrived}</span>
                                        </div>
                                        <Progress
                                            value={(shipmentSummary.arrived / shipmentSummary.total) * 100}
                                            className="h-2 bg-green-100"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Inventory Health */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Inventory Health</CardTitle>
                                    <CardDescription>Stock levels and expiry status</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Normal Stock</span>
                                            <span className="text-sm font-medium">
                                                {inventorySummary.totalItems - inventorySummary.lowStock}
                                            </span>
                                        </div>
                                        <Progress
                                            value={
                                                ((inventorySummary.totalItems - inventorySummary.lowStock) / inventorySummary.totalItems) * 100
                                            }
                                            className="h-2"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Low Stock</span>
                                            <span className="text-sm font-medium">{inventorySummary.lowStock}</span>
                                        </div>
                                        <Progress
                                            value={(inventorySummary.lowStock / inventorySummary.totalItems) * 100}
                                            className="h-2 bg-yellow-100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Expiring Soon</span>
                                            <span className="text-sm font-medium">{inventorySummary.expiringSoon}</span>
                                        </div>
                                        <Progress
                                            value={(inventorySummary.expiringSoon / inventorySummary.totalItems) * 100}
                                            className="h-2 bg-orange-100"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Order Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Status</CardTitle>
                                    <CardDescription>Payment and shipping status</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Paid & Shipped</span>
                                            <span className="text-sm font-medium">{ordersSummary.shipped}</span>
                                        </div>
                                        <Progress value={(ordersSummary.shipped / ordersSummary.total) * 100} className="h-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Pending Payment</span>
                                            <span className="text-sm font-medium">{ordersSummary.pending}</span>
                                        </div>
                                        <Progress
                                            value={(ordersSummary.pending / ordersSummary.total) * 100}
                                            className="h-2 bg-yellow-100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Delivered</span>
                                            <span className="text-sm font-medium">{ordersSummary.delivered}</span>
                                        </div>
                                        <Progress
                                            value={(ordersSummary.delivered / ordersSummary.total) * 100}
                                            className="h-2 bg-green-100"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="shipments" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Shipments</CardTitle>
                                <CardDescription>Latest shipment updates from vendors</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentShipments.map((shipment) => (
                                        <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{shipment.id}</span>
                                                    <Badge
                                                        variant={
                                                            shipment.status === "Delayed"
                                                                ? "destructive"
                                                                : shipment.status === "Arrived"
                                                                    ? "default"
                                                                    : "secondary"
                                                        }
                                                    >
                                                        {shipment.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">{shipment.vendor}</p>
                                                <p className="text-xs text-gray-500">Expected: {shipment.expectedArrival}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">S${shipment.value.toLocaleString()}</p>
                                                {shipment.delay > 0 && <p className="text-xs text-red-600">{shipment.delay} days delayed</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <Button asChild className="w-full">
                                        <Link href="/shipments">View All Shipments</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="inventory" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Critical Inventory Items</CardTitle>
                                <CardDescription>Items requiring immediate attention</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {criticalInventory.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{item.item}</span>
                                                    <Badge
                                                        variant={
                                                            item.status === "Expired"
                                                                ? "destructive"
                                                                : item.status === "Expiring Soon"
                                                                    ? "destructive"
                                                                    : "secondary"
                                                        }
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {item.quantity} {item.unit} remaining
                                                </p>
                                                <p className="text-xs text-gray-500">Expires: {item.expiryDate}</p>
                                            </div>
                                            <div className="text-right">
                                                {item.status === "Expired" && <AlertTriangle className="h-5 w-5 text-red-500" />}
                                                {item.status === "Expiring Soon" && <Clock className="h-5 w-5 text-orange-500" />}
                                                {item.status === "Low Stock" && <TrendingDown className="h-5 w-5 text-yellow-500" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <Button asChild className="w-full">
                                        <Link href="/inventory">Manage All Inventory</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="orders" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Orders</CardTitle>
                                <CardDescription>Latest customer orders and their status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{order.id}</span>
                                                    <Badge variant={order.paymentStatus === "Paid" ? "default" : "destructive"}>
                                                        {order.paymentStatus}
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            order.shippingStatus === "Delivered"
                                                                ? "default"
                                                                : order.shippingStatus === "Shipped"
                                                                    ? "secondary"
                                                                    : "outline"
                                                        }
                                                    >
                                                        {order.shippingStatus}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">{order.customer}</p>
                                                <p className="text-xs text-gray-500">{order.items}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">S${order.value.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">{order.orderDate}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <Button asChild className="w-full">
                                        <Link href="/orders">View All Orders</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
