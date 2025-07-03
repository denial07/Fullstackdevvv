"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, DollarSign, TrendingUp, TrendingDown, Calendar, ExternalLink } from "lucide-react"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"

// Mock revenue data
const monthlyRevenueData = [
    { month: "Jul 2023", revenue: 98000, expenditure: 72000, profit: 26000, orders: 28, avgOrderValue: 3500 },
    { month: "Aug 2023", revenue: 105000, expenditure: 78000, profit: 27000, orders: 32, avgOrderValue: 3281 },
    { month: "Sep 2023", revenue: 112000, expenditure: 82000, profit: 30000, orders: 35, avgOrderValue: 3200 },
    { month: "Oct 2023", revenue: 118000, expenditure: 85000, profit: 33000, orders: 38, avgOrderValue: 3105 },
    { month: "Nov 2023", revenue: 125000, expenditure: 88000, profit: 37000, orders: 40, avgOrderValue: 3125 },
    { month: "Dec 2023", revenue: 132000, expenditure: 92000, profit: 40000, orders: 42, avgOrderValue: 3143 },
    { month: "Jan 2024", revenue: 125000, expenditure: 85000, profit: 40000, orders: 38, avgOrderValue: 3289 },
    { month: "Feb 2024", revenue: 142000, expenditure: 92000, profit: 50000, orders: 45, avgOrderValue: 3156 },
    { month: "Mar 2024", revenue: 138000, expenditure: 88000, profit: 50000, orders: 43, avgOrderValue: 3209 },
    { month: "Apr 2024", revenue: 156000, expenditure: 95000, profit: 61000, orders: 48, avgOrderValue: 3250 },
    { month: "May 2024", revenue: 168000, expenditure: 102000, profit: 66000, orders: 52, avgOrderValue: 3231 },
    { month: "Jun 2024", revenue: 175000, expenditure: 108000, profit: 67000, orders: 54, avgOrderValue: 3241 },
]

const revenueBreakdown = [
    { category: "Standard Pallets", revenue: 85000, percentage: 48.6, orders: 28 },
    { category: "Heavy Duty Pallets", revenue: 42000, percentage: 24.0, orders: 12 },
    { category: "Custom Pallets", revenue: 28000, percentage: 16.0, orders: 8 },
    { category: "Export Pallets", revenue: 15000, percentage: 8.6, orders: 4 },
    { category: "Industrial Pallets", revenue: 5000, percentage: 2.8, orders: 2 },
]

const topCustomers = [
    { customer: "ABC Logistics Pte Ltd", revenue: 45000, orders: 12, avgOrder: 3750 },
    { customer: "Singapore Shipping Co.", revenue: 38000, orders: 10, avgOrder: 3800 },
    { customer: "Maritime Solutions Ltd", revenue: 32000, orders: 8, avgOrder: 4000 },
    { customer: "Global Trade Hub", revenue: 28000, orders: 7, avgOrder: 4000 },
    { customer: "Port Authority Singapore", revenue: 22000, orders: 5, avgOrder: 4400 },
    { customer: "Warehouse Solutions Pte", revenue: 10000, orders: 4, avgOrder: 2500 },
]

const colors = {
    primary: "#1e40af",
    secondary: "#059669",
    accent: "#dc2626",
    warning: "#d97706",
    neutral: "#6b7280",
    neutralLight: "#9ca3af",
    surface: "#ffffff",
}

export default function MonthlyRevenuePage() {
    const currentMonth = monthlyRevenueData[monthlyRevenueData.length - 1]
    const previousMonth = monthlyRevenueData[monthlyRevenueData.length - 2]
    const revenueGrowth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
    const profitGrowth = ((currentMonth.profit - previousMonth.profit) / previousMonth.profit) * 100
    const totalRevenue = monthlyRevenueData.reduce((sum, month) => sum + month.revenue, 0)
    const totalProfit = monthlyRevenueData.reduce((sum, month) => sum + month.profit, 0)

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
                                <h1 className="text-3xl font-bold text-gray-900">Monthly Revenue</h1>
                                <p className="text-gray-600">Financial performance and revenue analytics</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export Report
                            </Button>
                            <Button size="sm">Generate Invoice</Button>
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
                            <CardTitle className="text-sm font-medium text-slate-900">Current Month</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">S${currentMonth.revenue.toLocaleString()}</div>
                            <p className="text-xs flex items-center text-green-600">
                                <TrendingUp className="h-3 w-3 mr-1" />+{revenueGrowth.toFixed(1)}% from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Monthly Profit</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">S${currentMonth.profit.toLocaleString()}</div>
                            <p className="text-xs flex items-center text-green-600">
                                <TrendingUp className="h-3 w-3 mr-1" />+{profitGrowth.toFixed(1)}% from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Orders This Month</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{currentMonth.orders}</div>
                            <p className="text-xs text-slate-500">Avg: S${currentMonth.avgOrderValue.toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Profit Margin</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {((currentMonth.profit / currentMonth.revenue) * 100).toFixed(1)}%
                            </div>
                            <p className="text-xs text-slate-500">Current month</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">YTD Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                S$
                                {monthlyRevenueData
                                    .slice(-6)
                                    .reduce((sum, month) => sum + month.revenue, 0)
                                    .toLocaleString()}
                            </div>
                            <p className="text-xs text-slate-500">Last 6 months</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Links */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-slate-900">Quick Navigation</CardTitle>
                        <CardDescription className="text-slate-600">Access detailed financial sections</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button asChild className="h-16 flex-col space-y-2 bg-blue-600 hover:bg-blue-700">
                                <Link href="/orders">
                                    <DollarSign className="h-6 w-6" />
                                    <span>View All Orders</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-16 flex-col space-y-2 bg-transparent">
                                <Link href="/orders">
                                    <TrendingUp className="h-6 w-6" />
                                    <span>Payment Analytics</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-16 flex-col space-y-2 bg-transparent">
                                <Link href="/orders">
                                    <Calendar className="h-6 w-6" />
                                    <span>Financial Reports</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue Trend Chart */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-slate-900">Revenue Trend Analysis</CardTitle>
                        <CardDescription className="text-slate-600">
                            12-month revenue, expenditure, and profit trends
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={monthlyRevenueData}>
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

                {/* Revenue Breakdown and Top Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-slate-900">Revenue by Product Category</CardTitle>
                            <CardDescription className="text-slate-600">Current month breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {revenueBreakdown.map((category, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-700">{category.category}</span>
                                            <div className="text-right">
                                                <span className="text-sm font-medium text-slate-900">
                                                    S${category.revenue.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-slate-500 ml-2">({category.percentage}%)</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${category.percentage}%` }}></div>
                                        </div>
                                        <div className="text-xs text-slate-500">{category.orders} orders</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-slate-900">Top Customers by Revenue</CardTitle>
                            <CardDescription className="text-slate-600">Current month performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topCustomers.map((customer, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-900">{customer.customer}</p>
                                            <p className="text-sm text-slate-600">{customer.orders} orders</p>
                                            <p className="text-xs text-slate-500">Avg: S${customer.avgOrder.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-slate-900">S${customer.revenue.toLocaleString()}</p>
                                            <Badge variant="secondary">#{index + 1}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Performance Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-slate-900">Monthly Performance History</CardTitle>
                        <CardDescription className="text-slate-600">Detailed monthly financial metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        <TableHead>Revenue (S$)</TableHead>
                                        <TableHead>Expenditure (S$)</TableHead>
                                        <TableHead>Profit (S$)</TableHead>
                                        <TableHead>Profit Margin</TableHead>
                                        <TableHead>Orders</TableHead>
                                        <TableHead>Avg Order Value</TableHead>
                                        <TableHead>Growth</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monthlyRevenueData
                                        .slice()
                                        .reverse()
                                        .map((month, index) => {
                                            const prevMonth = monthlyRevenueData[monthlyRevenueData.length - index - 2]
                                            const growth = prevMonth ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0
                                            const profitMargin = (month.profit / month.revenue) * 100

                                            return (
                                                <TableRow key={month.month}>
                                                    <TableCell className="font-medium text-slate-900">{month.month}</TableCell>
                                                    <TableCell className="text-slate-900">{month.revenue.toLocaleString()}</TableCell>
                                                    <TableCell className="text-slate-900">{month.expenditure.toLocaleString()}</TableCell>
                                                    <TableCell className="text-slate-900">{month.profit.toLocaleString()}</TableCell>
                                                    <TableCell className="text-slate-900">{profitMargin.toFixed(1)}%</TableCell>
                                                    <TableCell className="text-slate-900">{month.orders}</TableCell>
                                                    <TableCell className="text-slate-900">{month.avgOrderValue.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        {growth > 0 ? (
                                                            <span className="flex items-center text-green-600">
                                                                <TrendingUp className="h-3 w-3 mr-1" />+{growth.toFixed(1)}%
                                                            </span>
                                                        ) : growth < 0 ? (
                                                            <span className="flex items-center text-red-600">
                                                                <TrendingDown className="h-3 w-3 mr-1" />
                                                                {growth.toFixed(1)}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
