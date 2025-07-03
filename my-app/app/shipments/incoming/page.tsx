
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
  ArrowLeft, Search, Filter, Download, Ship, Clock, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { UserNav } from "@/components/user-nav";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Arrived":
      return "default";
    case "In Transit":
    case "Customs Clearance":
      return "secondary";
    case "Delayed":
      return "destructive";
    case "Processing":
      return "outline";
    default:
      return "secondary";
  }
};

export default async function IncomingShipmentsPage() {
  await connectToDatabase();
  const rawShipments = await Shipment.find({ type: "incoming" }).lean();

  const incomingShipments = rawShipments.map((s: any) => {
    const eta = s.eta ? new Date(s.eta) : null;
    const arrival = s.arrival ? new Date(s.arrival) : null;

    const delay =
      eta && arrival
        ? Math.max(0, Math.ceil((arrival.getTime() - eta.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    return {
      id: s.id,
      vendor: s.vendor,
      status: s.status,
      shippingDate: s.shippingDate?.toISOString().split("T")[0] || "-",
      expectedArrival: eta?.toISOString().split("T")[0] || "-",
      actualArrival: arrival?.toISOString().split("T")[0] || "-",
      value: s.price,
      delay,
      items: s.description,
      trackingNumber: s.id,
      vessel: s.vessel || "N/A",
      port: s.port || "Port of Singapore",
    };
  });

  const totalValue = incomingShipments.reduce((sum, shipment) => sum + shipment.value, 0);
  const delayedShipments = incomingShipments.filter((s) => s.status === "Delayed").length;
  const inTransitShipments = incomingShipments.filter((s) => s.status === "In Transit").length;
  const arrivedShipments = incomingShipments.filter((s) => s.status === "Arrived").length;

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
                <p className="text-gray-600">Raw materials arriving from global vendors</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">Log Incoming</Button>
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
                      <TableCell>{shipment.vessel}</TableCell>
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
      </main>
    </div>
  );
}
