import { connectToDatabase } from "@/lib/mongodb"
import Shipment from "@/lib/models/Shipment"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Ship, Truck, Plus } from "lucide-react"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import { Edit } from "lucide-react"
import IncomingShipmentCard from "@/components/IncomingShipmentCard";
import OutgoingShipmentCard from "@/components/OutgoingShipmentCard";

// app/shipments/page.tsx  (Server Component)

export default async function ShipmentsPage() {
  // ✅ Call status updater before normalization
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shipments/status`, {
    method: "PATCH",
  });

  // 1) Fetch your API route (which already serializes _id, dates, etc.)
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shipments`, {
    next: { revalidate: 60 }, // or 'cache: "no-store"' if needed
  });

  const shipments: Array<{
    _id: string;
    type: "incoming" | "internal";
    id: string;
    vendor?: string;
    customer?: string;
    description?: string;
    price: number;
    status: string;
    eta?: string;
    newEta?: string;
    deliveredDate?: string;
    shippingDate?: string;
  }> = await res.json();

  // 2) Now filter client-safe JSON
  const activeincoming = shipments.filter(s => s.type.toLowerCase() === "incoming" && s.status !== "Delivered");
  const activeinternal = shipments.filter(s => s.type.toLowerCase() === "internal" && s.status !== "Delivered");
  const incoming = shipments.filter(s => s.type.toLowerCase() === "incoming");
  const internal = shipments.filter(s => s.type.toLowerCase() === "internal");
  const activeIncomingCount = activeincoming.length;
  const activeInternalCount = activeinternal.length;
  const incomingTotal = incoming.length;
  const internalTotal = internal.length;
  const incomingDelayed = incoming.filter((s) => s.status === "Delayed").length;
  const internalPreparing = internal.filter((s) => s.status === "Preparing").length;
  const totalThisMonth = shipments.filter((s) => {
    const rawDate = s.shippingDate || s.eta;

    if (!rawDate) return false; // skip if both are undefined

    const date = new Date(rawDate);
    const now = new Date();

    return (
      !isNaN(date.getTime()) && // ensure valid date
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  const combinedValue = shipments.reduce((total, s) => total + (s.price || 0), 0);

  // Sort and get latest 3


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
                <p className="text-gray-600">Track incoming and internal shipments</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/shipments/add">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shipment
                </Link>
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
              <CardTitle className="text-sm font-medium">Active Incoming Shipments</CardTitle>
              <Ship className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeIncomingCount}</div>
              <p className="text-xs text-muted-foreground">{incomingTotal} Total Incoming Shipments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Internal Shipments</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeInternalCount}</div>
              <p className="text-xs text-muted-foreground">{internalTotal} preparing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S${combinedValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Combined value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalThisMonth}</div>
              <p className="text-xs text-muted-foreground">Total shipments</p>
            </CardContent>
          </Card>
        </div>



        <Tabs defaultValue="incoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="incoming">Incoming Shipments</TabsTrigger>
            <TabsTrigger value="internal">Internal Shipments</TabsTrigger>
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
                  {incoming.map((shipment) => (
                    <IncomingShipmentCard key={shipment._id} shipment={shipment} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="internal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Internal Shipments
                </CardTitle>
                <CardDescription>Pallet deliveries Internally</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-600">Track customer order deliveries</p>
                  <Button asChild>
                    <Link href="/shipments/internal">View Detailed Internal</Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {internal.map((shipment) => (
                    <OutgoingShipmentCard key={String(shipment._id)} shipment={shipment} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>



      </main>
    </div >
  )
}


