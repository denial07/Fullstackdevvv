import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Ship, Truck } from "lucide-react";
import Link from "next/link";

// 👇 Fetch data on the server
async function getShipments() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/shipments`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function ShipmentsPage() {
  const shipments = await getShipments();

  const incoming = shipments.filter((s: any) => s.type === "incoming");
  const outgoing = shipments.filter((s: any) => s.type === "outgoing");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... header and summary cards stay the same ... */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="incoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="incoming">Incoming Shipments</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing Shipments</TabsTrigger>
          </TabsList>

          {/* Incoming Shipments Tab */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {incoming.map((ship: any) => (
                    <div key={ship.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{ship.id}</span>
                        <Badge variant="default">{ship.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{ship.vendor}</p>
                      <p className="text-xs text-gray-500">{ship.description}</p>
                      <p className="text-xs text-gray-500">
                        {ship.eta ? `ETA: ${new Date(ship.eta).toDateString()}` : ""}
                        {ship.arrival ? `Arrived: ${new Date(ship.arrival).toDateString()}` : ""}
                      </p>
                      <p className="font-medium mt-2">S${ship.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outgoing Shipments Tab */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outgoing.map((ship: any) => (
                    <div key={ship.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{ship.id}</span>
                        <Badge variant="default">{ship.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{ship.vendor}</p>
                      <p className="text-xs text-gray-500">{ship.description}</p>
                      <p className="text-xs text-gray-500">
                        {ship.eta ? `ETA: ${new Date(ship.eta).toDateString()}` : ""}
                        {ship.arrival ? `Delivered: ${new Date(ship.arrival).toDateString()}` : ""}
                      </p>
                      <p className="font-medium mt-2">S${ship.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
