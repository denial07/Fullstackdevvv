import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Ship, Truck, Plus } from "lucide-react"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"

export default function ShipmentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px:8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Shipment Management</h1>
                <p className="text-gray-600">Track incoming and outgoing shipments</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Shipment
              </Button>
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incoming Shipments</CardTitle>
              <Ship className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">3 delayed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outgoing Shipments</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">6 pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S$401,000</div>
              <p className="text-xs text-muted-foreground">Combined value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">Total shipments</p>
            </CardContent>
          </Card>
        </div>

        {/* Shipment Tabs */}
        <Tabs defaultValue="incoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="incoming">Incoming Shipments</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing Shipments</TabsTrigger>
          </TabsList>

          <TabsContent value="incoming">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ship className="h-5 w-5 mr-2" />
                  Incoming Shipments
                </CardTitle>
                <CardDescription>Wood shipments from overseas vendors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-600">Manage incoming raw material shipments</p>
                  <Button asChild>
                    <Link href="/shipments/incoming">View Detailed Incoming</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">SH-IN-001</span>
                      <Badge variant="secondary">In Transit</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Malaysian Timber Co.</p>
                    <p className="text-xs text-gray-500">Teak Wood - 50m³</p>
                    <p className="text-xs text-gray-500">ETA: Jan 15, 2024</p>
                    <p className="font-medium mt-2">S$15,000</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">SH-IN-002</span>
                      <Badge variant="destructive">Delayed</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Indonesian Wood Supply</p>
                    <p className="text-xs text-gray-500">Pine Wood - 75m³</p>
                    <p className="text-xs text-gray-500">ETA: Jan 12, 2024 (3 days late)</p>
                    <p className="font-medium mt-2">S$22,000</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">SH-IN-003</span>
                      <Badge variant="default">Arrived</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Thai Forest Products</p>
                    <p className="text-xs text-gray-500">Oak Wood - 40m³</p>
                    <p className="text-xs text-gray-500">Arrived: Jan 8, 2024</p>
                    <p className="font-medium mt-2">S$18,500</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outgoing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Outgoing Shipments
                </CardTitle>
                <CardDescription>Pallet deliveries to customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-600">Track customer order deliveries</p>
                  <Button asChild>
                    <Link href="/shipments/outgoing">View Detailed Outgoing</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">SH-OUT-001</span>
                      <Badge variant="default">Delivered</Badge>
                    </div>
                    <p className="text-sm text-gray-600">ABC Logistics Pte Ltd</p>
                    <p className="text-xs text-gray-500">Standard Pallets x 500</p>
                    <p className="text-xs text-gray-500">Delivered: Jan 10, 2024</p>
                    <p className="font-medium mt-2">S$12,500</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">SH-OUT-002</span>
                      <Badge variant="secondary">In Transit</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Singapore Shipping Co.</p>
                    <p className="text-xs text-gray-500">Heavy Duty Pallets x 200</p>
                    <p className="text-xs text-gray-500">ETA: Jan 14, 2024</p>
                    <p className="font-medium mt-2">S$8,900</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">SH-OUT-003</span>
                      <Badge variant="outline">Preparing</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Maritime Solutions Ltd</p>
                    <p className="text-xs text-gray-500">Custom Pallets x 150</p>
                    <p className="text-xs text-gray-500">Scheduled: Jan 16, 2024</p>
                    <p className="font-medium mt-2">S$6,750</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
