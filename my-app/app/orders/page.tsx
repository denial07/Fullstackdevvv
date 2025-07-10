import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Search, Filter, Download, ShoppingCart, DollarSign, Truck, AlertCircle } from "lucide-react"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"

// Mock orders data
const orders = [
  {
    id: "ORD-001",
    customer: "ABC Logistics Pte Ltd",
    customerEmail: "orders@abclogistics.sg",
    items: "Standard Pallets x 500",
    quantity: 500,
    unitPrice: 25,
    totalValue: 12500,
    orderDate: "2024-01-08",
    dueDate: "2024-01-15",
    paymentStatus: "Paid",
    paymentDate: "2024-01-09",
    shippingStatus: "Delivered",
    shippingDate: "2024-01-10",
    deliveryDate: "2024-01-10",
    priority: "Standard",
  },
  {
    id: "ORD-002",
    customer: "Singapore Shipping Co.",
    customerEmail: "procurement@sgshipping.com",
    items: "Heavy Duty Pallets x 200",
    quantity: 200,
    unitPrice: 44.5,
    totalValue: 8900,
    orderDate: "2024-01-10",
    dueDate: "2024-01-17",
    paymentStatus: "Pending",
    paymentDate: null,
    shippingStatus: "Processing",
    shippingDate: null,
    deliveryDate: null,
    priority: "High",
  },
  {
    id: "ORD-003",
    customer: "Maritime Solutions Ltd",
    customerEmail: "orders@maritime-sol.sg",
    items: "Custom Pallets x 150",
    quantity: 150,
    unitPrice: 45,
    totalValue: 6750,
    orderDate: "2024-01-12",
    dueDate: "2024-01-19",
    paymentStatus: "Paid",
    paymentDate: "2024-01-12",
    shippingStatus: "Preparing",
    shippingDate: "2024-01-16",
    deliveryDate: null,
    priority: "Standard",
  },
  {
    id: "ORD-004",
    customer: "Global Trade Hub",
    customerEmail: "supply@globaltrade.sg",
    items: "Export Pallets x 400",
    quantity: 400,
    unitPrice: 39,
    totalValue: 15600,
    orderDate: "2024-01-13",
    dueDate: "2024-01-20",
    paymentStatus: "Paid",
    paymentDate: "2024-01-14",
    shippingStatus: "Scheduled",
    shippingDate: "2024-01-18",
    deliveryDate: null,
    priority: "Standard",
  },
  {
    id: "ORD-005",
    customer: "Port Authority Singapore",
    customerEmail: "procurement@portauth.sg",
    items: "Industrial Pallets x 600",
    quantity: 600,
    unitPrice: 36.67,
    totalValue: 22000,
    orderDate: "2024-01-11",
    dueDate: "2024-01-18",
    paymentStatus: "Overdue",
    paymentDate: null,
    shippingStatus: "On Hold",
    shippingDate: null,
    deliveryDate: null,
    priority: "High",
  },
  {
    id: "ORD-006",
    customer: "Warehouse Solutions Pte",
    customerEmail: "orders@warehouse-sol.sg",
    items: "Standard Pallets x 300",
    quantity: 300,
    unitPrice: 25,
    totalValue: 7500,
    orderDate: "2024-01-14",
    dueDate: "2024-01-21",
    paymentStatus: "Pending",
    paymentDate: null,
    shippingStatus: "Pending",
    shippingDate: null,
    deliveryDate: null,
    priority: "Standard",
  },
]

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "Paid":
      return "default"
    case "Pending":
      return "secondary"
    case "Overdue":
      return "destructive"
    default:
      return "secondary"
  }
}

const getShippingStatusColor = (status: string) => {
  switch (status) {
    case "Delivered":
      return "default"
    case "Processing":
      return "secondary"
    case "Preparing":
      return "secondary"
    case "Scheduled":
      return "outline"
    case "On Hold":
      return "destructive"
    case "Pending":
      return "outline"
    default:
      return "secondary"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "destructive"
    case "Standard":
      return "secondary"
    default:
      return "secondary"
  }
}

export default function OrdersPage() {
  const totalOrders = orders.length
  const paidOrders = orders.filter((o) => o.paymentStatus === "Paid").length
  const pendingPayment = orders.filter((o) => o.paymentStatus === "Pending").length
  const overduePayment = orders.filter((o) => o.paymentStatus === "Overdue").length
  const shippedOrders = orders.filter((o) => o.shippingStatus === "Delivered").length
  const totalValue = orders.reduce((sum, order) => sum + order.totalValue, 0)
  const paidValue = orders.filter((o) => o.paymentStatus === "Paid").reduce((sum, order) => sum + order.totalValue, 0)

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
                <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                <p className="text-gray-600">Track customer orders, payments, and shipping status</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">New Order</Button>
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
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Orders</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{paidOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingPayment}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overduePayment}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipped</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shippedOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S${totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">S${paidValue.toLocaleString()} collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts */}
        {(pendingPayment > 0 || overduePayment > 0) && (
          <Card className="mb-6 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                Payment Alerts
              </CardTitle>
              <CardDescription>Orders requiring payment attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders
                  .filter((order) => order.paymentStatus === "Overdue" || order.paymentStatus === "Pending")
                  .map((order) => (
                    <div
                      key={order.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        order.paymentStatus === "Overdue"
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{order.id}</span>
                          <Badge variant={getPaymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
                          {order.priority === "High" && <Badge variant="destructive">High Priority</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{order.customer}</p>
                        <p className="text-xs text-gray-500">Due: {order.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">S${order.totalValue.toLocaleString()}</p>
                        <Button size="sm" className="mt-1">
                          Send Reminder
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                  <Input placeholder="Search by order ID, customer, or email..." className="pl-10" />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>Complete list of customer orders with payment and shipping status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Value (S$)</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Shipping Status</TableHead>
                    <TableHead>Shipping Date</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer}</p>
                          <p className="text-xs text-gray-500">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{order.items}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>{order.totalValue.toLocaleString()}</TableCell>
                      <TableCell>{order.orderDate}</TableCell>
                      <TableCell>{order.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant={getPaymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
                      </TableCell>
                      <TableCell>{order.paymentDate || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getShippingStatusColor(order.shippingStatus)}>{order.shippingStatus}</Badge>
                      </TableCell>
                      <TableCell>{order.shippingDate || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(order.priority)}>{order.priority}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Order Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Analytics</CardTitle>
              <CardDescription>Payment status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Paid Orders</span>
                  <span className="text-sm font-medium">{paidOrders} orders</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending Payment</span>
                  <span className="text-sm font-medium">{pendingPayment} orders</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Overdue Payment</span>
                  <span className="text-sm font-medium text-red-600">{overduePayment} orders</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Collection Rate</span>
                    <span className="text-sm font-medium">{Math.round((paidValue / totalValue) * 100)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Analytics</CardTitle>
              <CardDescription>Fulfillment status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Delivered</span>
                  <span className="text-sm font-medium">
                    {orders.filter((o) => o.shippingStatus === "Delivered").length} orders
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">In Progress</span>
                  <span className="text-sm font-medium">
                    {orders.filter((o) => ["Processing", "Preparing", "Scheduled"].includes(o.shippingStatus)).length}{" "}
                    orders
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">On Hold</span>
                  <span className="text-sm font-medium text-red-600">
                    {orders.filter((o) => o.shippingStatus === "On Hold").length} orders
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fulfillment Rate</span>
                    <span className="text-sm font-medium">{Math.round((shippedOrders / totalOrders) * 100)}%</span>
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
