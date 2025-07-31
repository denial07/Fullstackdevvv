'use client'

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  Package,
  Ship,
  TrendingDown,
  Clock,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { ChatBot } from "@/components/chatbot"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"

import { getShipmentSummary, getInventorySummary, getOrdersSummary } from "@/lib/summaries";
import type { ShipmentSummary, InventorySummary, OrdersSummary } from "@/lib/summaries";




// Professional color palette
const colors = {
  primary: "#1e40af", // Blue-700
  primaryLight: "#3b82f6", // Blue-500
  secondary: "#059669", // Emerald-600
  secondaryLight: "#10b981", // Emerald-500
  accent: "#dc2626", // Red-600
  accentLight: "#ef4444", // Red-500
  warning: "#d97706", // Amber-600
  warningLight: "#f59e0b", // Amber-500
  neutral: "#6b7280", // Gray-500
  neutralLight: "#9ca3af", // Gray-400
  background: "#f8fafc", // Slate-50
  surface: "#ffffff", // White
  good: "#16a34a", // Green-600
  okay: "#f59e0b", // Amber-500
}




// Mock data for demonstration
// const shipmentSummary = {
//   total: 24,
//   inTransit: 8,
//   delayed: 3,
//   arrived: 13,
//   totalValue: 245000,
// }

// const inventorySummary = {
//   totalItems: 156,
//   lowStock: 12,
//   expiringSoon: 8,
//   expired: 2,
//   totalValue: 89000,
// }

// const ordersSummary = {
//   total: 42,
//   pending: 8,
//   paid: 28,
//   shipped: 24,
//   delivered: 18,
//   totalValue: 156000,
// }




// Chart data with professional colors
const revenueData = [
  { month: "Jan", revenue: 125000, expenditure: 85000, profit: 40000 },
  { month: "Feb", revenue: 142000, expenditure: 92000, profit: 50000 },
  { month: "Mar", revenue: 138000, expenditure: 88000, profit: 50000 },
  { month: "Apr", revenue: 156000, expenditure: 95000, profit: 61000 },
  { month: "May", revenue: 168000, expenditure: 102000, profit: 66000 },
  { month: "Jun", revenue: 175000, expenditure: 108000, profit: 67000 },
]

const shipmentTrendData = [
  { week: "Week 1", incoming: 12, outgoing: 8, delayed: 2 },
  { week: "Week 2", incoming: 15, outgoing: 11, delayed: 1 },
  { week: "Week 3", incoming: 18, outgoing: 14, delayed: 3 },
  { week: "Week 4", incoming: 22, outgoing: 18, delayed: 2 },
]

const inventoryValueData = [
  { category: "Teak Wood", value: 35000, percentage: 39 },
  { category: "Pine Wood", value: 22000, percentage: 25 },
  { category: "Oak Wood", value: 18000, percentage: 20 },
  { category: "Hardware", value: 8000, percentage: 9 },
  { category: "Other", value: 6000, percentage: 7 },
]

const orderStatusData = [
  { status: "Delivered", count: 18, color: colors.secondary },
  { status: "Shipped", count: 6, color: colors.primary },
  { status: "Processing", count: 10, color: colors.warning },
  { status: "Pending Payment", count: 8, color: colors.accent },
]

const dailyOperationsData = [
  { day: "Mon", orders: 8, shipments: 5, inventory: 12 },
  { day: "Tue", orders: 12, shipments: 7, inventory: 8 },
  { day: "Wed", orders: 15, shipments: 9, inventory: 15 },
  { day: "Thu", orders: 10, shipments: 6, inventory: 10 },
  { day: "Fri", orders: 18, shipments: 12, inventory: 20 },
  { day: "Sat", orders: 6, shipments: 3, inventory: 5 },
  { day: "Sun", orders: 4, shipments: 2, inventory: 3 },
]

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

type DashboardProps = {
  shipmentSummary: {
    total: number
    inTransit: number
    delayed: number
    arrived: number
    totalValue: number
  }
  inventorySummary: {
    totalItems: number
    lowStock: number
    expiringSoon: number
    expired: number
    totalValue: number
  }
  ordersSummary: {
    total: number
    pending: number
    paid: number
    shipped: number
    delivered: number
    totalValue: number
  }
}




export default function DashboardPage() {
  const [data, setData] = useState<DashboardProps | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)


  




  useEffect(() => {
    fetchSummary()
    
  }, [])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/summary")
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard summary")
      }
      const summary = await response.json()
      setData(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        <span>Loading dashboard summary...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-semibold">
        Error: {error}
      </div>
    )
  }

  if (!data) return null

  const { shipmentSummary, inventorySummary, ordersSummary } = data

  return  (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

            {/* Card 1 - Shipments */}
            <Link href="/metrics/active-shipments">
              <Card className="border-slate-200 shadow-sm hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-900">Active Shipments</CardTitle>
                  <Ship className="h-4 w-4" style={{ color: colors.primary }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{shipmentSummary.inTransit}</div>
                  <p className="text-xs text-slate-500">{shipmentSummary.delayed} delayed</p>
                </CardContent>
              </Card>
            </Link>

            {/* Card 2 - Inventory */}
            <Link href="/metrics/inventory-items">
              <Card className="border-slate-200 shadow-sm hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-900">Inventory Items</CardTitle>
                  <Package className="h-4 w-4" style={{ color: colors.secondary }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{inventorySummary.totalItems}</div>
                  <p className="text-xs text-slate-500">{inventorySummary.lowStock} low stock</p>
                </CardContent>
              </Card>
            </Link>

            {/* Card 3 - Orders */}
            <Link href="/metrics/active-orders">
              <Card className="border-slate-200 shadow-sm hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-900">Active Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4" style={{ color: colors.warning }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{ordersSummary.total}</div>
                  <p className="text-xs text-slate-500">{ordersSummary.pending} pending payment</p>
                </CardContent>
              </Card>
            </Link>

            {/* Card 4 - Revenue */}
            <Link href="/metrics/monthly-revenue">
              <Card className="border-slate-200 shadow-sm hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-900">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4" style={{ color: colors.secondary }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">S${ordersSummary.totalValue.toLocaleString()}</div>
                  <p className="text-xs flex items-center" style={{ color: colors.secondary }}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Card 5 - Alerts */}
            <Link href="/metrics/critical-alerts">
              <Card className="border-slate-200 shadow-sm hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-900">Critical Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4" style={{ color: colors.accent }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {inventorySummary.expiringSoon + inventorySummary.expired}
                  </div>
                  <p className="text-xs text-slate-500">Items need attention</p>
                </CardContent>
              </Card>
            </Link>

          </div>
        </main>


        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="operations" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Operations
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">

            {/* Operational Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Shipment Status</CardTitle>
                  <CardDescription className="text-slate-600">Current status of all shipments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">In Transit</span>
                      <span className="text-sm font-medium text-gray-900">{shipmentSummary.inTransit}</span>
                    </div>
                    <Progress
                      value={(shipmentSummary.inTransit / shipmentSummary.total) * 100}
                      className="h-2"
                      style={{ backgroundColor: colors.neutralLight }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">Delayed</span>
                      <span className="text-sm font-medium text-gray-900">{shipmentSummary.delayed}</span>
                    </div>
                    <Progress
                      value={(shipmentSummary.delayed / shipmentSummary.total) * 100}
                      className="h-2"
                      style={{ backgroundColor: colors.neutralLight }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">Arrived</span>
                      <span className="text-sm font-medium text-gray-900">{shipmentSummary.arrived}</span>
                    </div>
                    <Progress
                      value={(shipmentSummary.arrived / shipmentSummary.total) * 100}
                      className="h-2"
                      style={{ backgroundColor: colors.neutralLight }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Inventory Health</CardTitle>
                  <CardDescription className="text-slate-600">Stock levels and expiry status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">Normal Stock</span>
                      <span className="text-sm font-medium text-gray-900">
                        {inventorySummary.totalItems - inventorySummary.lowStock}
                      </span>
                    </div>
                    <Progress
                      value={
                        ((inventorySummary.totalItems - inventorySummary.lowStock) / inventorySummary.totalItems) * 100
                      }
                      className="h-2"
                      style={{ backgroundColor: colors.neutralLight }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">Low Stock</span>
                      <span className="text-sm font-medium text-gray-900">{inventorySummary.lowStock}</span>
                    </div>
                    <Progress
                      value={(inventorySummary.lowStock / inventorySummary.totalItems) * 100}
                      className="h-2"
                      style={{ backgroundColor: colors.neutralLight }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">Expiring Soon</span>
                      <span className="text-sm font-medium text-gray-900">{inventorySummary.expiringSoon}</span>
                    </div>
                    <Progress
                      value={(inventorySummary.expiringSoon / inventorySummary.totalItems) * 100}
                      className="h-2"
                      style={{ backgroundColor: colors.neutralLight }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Order Status</CardTitle>
                  <CardDescription className="text-slate-600">Payment and shipping status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">Paid & Shipped</span>
                      <span className="text-sm font-medium text-gray-900">{ordersSummary.shipped}</span>
                    </div>
                    <Progress
                      value={(ordersSummary.shipped / ordersSummary.total) * 100}
                      className="h-2"
                      style={{ backgroundColor: colors.neutralLight }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">Pending Payment</span>
                      <span className="text-sm font-medium text-gray-900">{ordersSummary.pending}</span>
                    </div>
                    <Progress
                      value={(ordersSummary.pending / ordersSummary.total) * 100}
                      className="h-2"
                      style={{ backgroundColor: colors.neutralLight }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">Delivered</span>
                      <span className="text-sm font-medium text-gray-900">{ordersSummary.delivered}</span>
                    </div>
                    <Progress
                      value={(ordersSummary.delivered / ordersSummary.total) * 100}
                      className="h-2"
                      style={{ backgroundColor: colors.neutralLight }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Inventory Value Distribution</CardTitle>
                  <CardDescription className="text-slate-600">Current inventory value by wood type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={inventoryValueData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {inventoryValueData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [colors.primary, colors.secondary, colors.warning, colors.accent, colors.neutral][index]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`S$${value.toLocaleString()}`, "Value"]}
                        contentStyle={{ backgroundColor: colors.surface, border: `1px solid ${colors.neutralLight}` }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Order Status Distribution</CardTitle>
                  <CardDescription className="text-slate-600">Current order status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: colors.surface, border: `1px solid ${colors.neutralLight}` }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Financial Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Revenue vs Expenditure</CardTitle>
                  <CardDescription className="text-slate-600">
                    Monthly financial performance over the last 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralLight} />
                      <XAxis dataKey="month" stroke={colors.neutral} />
                      <YAxis tickFormatter={(value) => `S$${(value / 1000).toFixed(0)}k`} stroke={colors.neutral} />
                      <Tooltip
                        formatter={(value) => [`S$${value.toLocaleString()}`, ""]}
                        contentStyle={{ backgroundColor: colors.surface, border: `1px solid ${colors.neutralLight}` }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke={colors.secondary}
                        fill={colors.secondary}
                        fillOpacity={0.6}
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenditure"
                        stackId="2"
                        stroke={colors.accent}
                        fill={colors.accent}
                        fillOpacity={0.6}
                        name="Expenditure"
                      />
                      <Line type="monotone" dataKey="profit" stroke={colors.primary} strokeWidth={3} name="Profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Shipment Trends</CardTitle>
                  <CardDescription className="text-slate-600">Weekly shipment activity and delays</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={shipmentTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralLight} />
                      <XAxis dataKey="week" stroke={colors.neutral} />
                      <YAxis stroke={colors.neutral} />
                      <Tooltip
                        contentStyle={{ backgroundColor: colors.surface, border: `1px solid ${colors.neutralLight}` }}
                      />
                      <Legend />
                      <Bar dataKey="incoming" fill={colors.secondary} name="Incoming" />
                      <Bar dataKey="outgoing" fill={colors.primary} name="Outgoing" />
                      <Bar dataKey="delayed" fill={colors.accent} name="Delayed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Daily Operations */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Daily Operations Overview</CardTitle>
                <CardDescription className="text-slate-600">
                  Weekly activity across orders, shipments, and inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyOperationsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.neutralLight} />
                    <XAxis dataKey="day" stroke={colors.neutral} />
                    <YAxis stroke={colors.neutral} />
                    <Tooltip
                      contentStyle={{ backgroundColor: colors.surface, border: `1px solid ${colors.neutralLight}` }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="orders" stroke={colors.secondary} strokeWidth={2} name="Orders" />
                    <Line
                      type="monotone"
                      dataKey="shipments"
                      stroke={colors.primary}
                      strokeWidth={2}
                      name="Shipments"
                    />
                    <Line
                      type="monotone"
                      dataKey="inventory"
                      stroke={colors.warning}
                      strokeWidth={2}
                      name="Inventory Updates"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Shipments */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Recent Shipments</CardTitle>
                  <CardDescription className="text-slate-600">Latest shipment updates from vendors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentShipments.map((shipment) => (
                      <div
                        key={shipment.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-900">{shipment.id}</span>
                            <Badge
                              style={{
                                backgroundColor:
                                  shipment.status === "Delayed"
                                    ? colors.accent
                                    : shipment.status === "Arrived"
                                      ? colors.secondary
                                      : colors.primary,
                                color: "white",
                              }}
                            >
                              {shipment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{shipment.vendor}</p>
                          <p className="text-xs text-slate-500">Expected: {shipment.expectedArrival}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">S${shipment.value.toLocaleString()}</p>
                          {shipment.delay > 0 && (
                            <p className="text-xs" style={{ color: colors.accent }}>
                              {shipment.delay} days delayed
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      asChild
                      className="w-full"
                      style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                    >
                      <Link href="/shipments">View All Shipments</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Critical Inventory */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Critical Inventory Items</CardTitle>
                  <CardDescription className="text-slate-600">Items requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {criticalInventory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-900">{item.item}</span>
                            <Badge
                              style={{
                                backgroundColor:
                                  item.status === "Expired"
                                    ? colors.accent
                                    : item.status === "Expiring Soon"
                                      ? colors.warning
                                      : colors.neutral,
                                color: "white",
                              }}
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            {item.quantity} {item.unit} remaining
                          </p>
                          <p className="text-xs text-slate-500">Expires: {item.expiryDate}</p>
                        </div>
                        <div className="text-right">
                          {item.status === "Expired" && (
                            <AlertTriangle className="h-5 w-5" style={{ color: colors.accent }} />
                          )}
                          {item.status === "Expiring Soon" && (
                            <Clock className="h-5 w-5" style={{ color: colors.warning }} />
                          )}
                          {item.status === "Low Stock" && (
                            <TrendingDown className="h-5 w-5" style={{ color: colors.neutral }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      asChild
                      className="w-full"
                      style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                    >
                      <Link href="/inventory">Manage All Inventory</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Recent Orders */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Recent Orders</CardTitle>
                <CardDescription className="text-slate-600">Latest customer orders and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-900">{order.id}</span>
                          <Badge
                            style={{
                              backgroundColor: order.paymentStatus === "Paid" ? colors.secondary : colors.accent,
                              color: "white",
                            }}
                          >
                            {order.paymentStatus}
                          </Badge>
                          <Badge
                            style={{
                              backgroundColor:
                                order.shippingStatus === "Delivered"
                                  ? colors.secondary
                                  : order.shippingStatus === "Shipped"
                                    ? colors.primary
                                    : colors.warning,
                              color: "white",
                            }}
                          >
                            {order.shippingStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{order.customer}</p>
                        <p className="text-xs text-slate-500">{order.items}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">S${order.value.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{order.orderDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button
                    asChild
                    className="w-full"
                    style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                  >
                    <Link href="/orders">View All Orders</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Chatbot Toggle Button */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chatbot Component */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
