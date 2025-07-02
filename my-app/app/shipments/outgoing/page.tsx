// app/outgoing-shipments/page.tsx
import { connectToDatabase } from "@/lib/mongodb";
import Shipment from "@/lib/models/Shipment";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Search, Filter, Download, Truck, Clock, CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { UserNav } from "@/components/user-nav";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Delivered":
      return "default";
    case "In Transit":
    case "Loading":
      return "secondary";
    case "Preparing":
    case "Scheduled":
      return "outline";
    default:
      return "secondary";
  }
};

export default async function OutgoingShipmentsPage() {
  await connectToDatabase();
  const rawShipments = await Shipment.find({ type: "outgoing" }).lean();

  const outgoingShipments = rawShipments.map((s: any) => ({
    id: s.id,
    customer: s.customer,
    status: s.status,
    orderDate: s.orderDate?.toISOString().split("T")[0] || "-",
    shippingDate: s.shippingDate?.toISOString().split("T")[0] || "-",
    deliveryDate: s.deliveryDate?.toISOString().split("T")[0] || null,
    value: s.price,
    items: s.description,
    trackingNumber: s.trackingNumber || s.id,
    driver: s.driver || "TBD",
    vehicle: s.vehicle || "TBD",
    address: s.address,
  }));

  const totalValue = outgoingShipments.reduce((sum, shipment) => sum + shipment.value, 0);
  const deliveredShipments = outgoingShipments.filter((s) => s.status === "Delivered").length;
  const inTransitShipments = outgoingShipments.filter(
    (s) => s.status === "In Transit" || s.status === "Loading"
  ).length;
  const preparingShipments = outgoingShipments.filter(
    (s) => s.status === "Preparing" || s.status === "Scheduled"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Summary Cards */}
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
                <h1 className="text-3xl font-bold text-gray-900">Outgoing Shipments</h1>
                <p className="text-gray-600">Pallet deliveries to customers</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">Schedule Delivery</Button>
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outgoing</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{outgoingShipments.length}</div>
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
              <CardTitle className="text-sm font-medium">Preparing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{preparingShipments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{deliveredShipments}</div>
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

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by shipment ID, customer, or tracking number..." className="pl-10" />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Outgoing Shipments Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Outgoing Shipments</CardTitle>
            <CardDescription>Pallet deliveries to customers across Singapore</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Shipping Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Value (S$)</TableHead>
                    <TableHead>Tracking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outgoingShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.id}</TableCell>
                      <TableCell>{shipment.customer}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(shipment.status)}>{shipment.status}</Badge>
                      </TableCell>
                      <TableCell>{shipment.items}</TableCell>
                      <TableCell>{shipment.orderDate}</TableCell>
                      <TableCell>{shipment.shippingDate}</TableCell>
                      <TableCell>{shipment.deliveryDate || "-"}</TableCell>
                      <TableCell>{shipment.driver}</TableCell>
                      <TableCell>{shipment.vehicle}</TableCell>
                      <TableCell>{shipment.value.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{shipment.trackingNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Fleet Status Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Delivery Fleet Status</CardTitle>
            <CardDescription>Current status of delivery vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">3</div>
                <div className="text-sm text-green-800">Vehicles Available</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">2</div>
                <div className="text-sm text-blue-800">On Delivery</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">1</div>
                <div className="text-sm text-yellow-800">Loading</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">6</div>
                <div className="text-sm text-purple-800">Total Fleet Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
