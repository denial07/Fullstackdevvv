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

export default async function ShipmentsPage() {
  await connectToDatabase()
  const rawShipments = await Shipment.find().lean()

  const incoming = rawShipments.filter((s) => s.type === "incoming")
  const outgoing = rawShipments.filter((s) => s.type === "outgoing")

  const incomingTotal = incoming.length
  const incomingDelayed = incoming.filter((s) => s.status === "Delayed").length
  const incomingValue = incoming.reduce((sum, s) => sum + (s.price || 0), 0)

  const outgoingTotal = outgoing.length
  const outgoingPreparing = outgoing.filter((s) => ["Preparing", "Scheduled"].includes(s.status)).length
  const outgoingValue = outgoing.reduce((sum, s) => sum + (s.price || 0), 0)

  const combinedValue = incomingValue + outgoingValue
  const totalThisMonth = rawShipments.length // optionally filter by date if needed



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
                <p className="text-gray-600">Track incoming and outgoing shipments</p>
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
              <CardTitle className="text-sm font-medium">Incoming Shipments</CardTitle>
              <Ship className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incomingTotal}</div>
              <p className="text-xs text-muted-foreground">{incomingDelayed} delayed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outgoing Shipments</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{outgoingTotal}</div>
              <p className="text-xs text-muted-foreground">{outgoingPreparing} preparing</p>
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
                  {incoming.map((shipment) => (
                    <IncomingShipmentCard key={String(shipment._id)} shipment={shipment} />
                  ))}
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
                  {outgoing.map((shipment) => (
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


