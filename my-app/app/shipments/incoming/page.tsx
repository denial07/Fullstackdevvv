// app/incoming-shipments/page.tsx
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
      return "secondary";
    case "Delayed":
      return "destructive";
    case "Processing":
      return "outline";
    case "Customs Clearance":
      return "secondary";
    default:
      return "secondary";
  }
};

export default async function IncomingShipmentsPage() {
  await connectToDatabase();
  const rawShipments = await Shipment.find({ type: "incoming" }).lean();

  const incomingShipments = rawShipments.map((s: any) => ({
    id: s.id,
    vendor: s.vendor,
    status: s.status,
    shippingDate: s.arrival?.toISOString().split("T")[0] || "-",
    expectedArrival: s.eta?.toISOString().split("T")[0] || "-",
    actualArrival: s.arrival?.toISOString().split("T")[0] || null,
    value: s.price,
    delay: 0, // Optional: you could calculate based on ETA vs arrival here
    items: s.description,
    trackingNumber: s.id,
    vessel: "N/A",
    port: "Port of Singapore",
  }));

  const totalValue = incomingShipments.reduce((sum, shipment) => sum + shipment.value, 0);
  const delayedShipments = incomingShipments.filter((s) => s.status === "Delayed").length;
  const inTransitShipments = incomingShipments.filter((s) => s.status === "In Transit").length;
  const arrivedShipments = incomingShipments.filter((s) => s.status === "Arrived").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* -- Header (same as before) -- */}
      {/* -- Summary Cards (same as before, using inTransitShipments etc.) -- */}
      {/* -- Filters/Search UI (same as before) -- */}
      {/* -- Table Section below -- */}
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
      {/* -- AI Email Processing Card (same as before) -- */}
    </div>
  );
}
