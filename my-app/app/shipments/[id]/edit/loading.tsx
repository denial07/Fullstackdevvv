import { Button } from "@/components/ui/button"
import { ArrowLeft, Package } from "lucide-react"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"

export default function EditShipmentLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
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
                                <h1 className="text-3xl font-bold text-gray-900">Edit Shipment</h1>
                                <p className="text-gray-600">Loading shipment data...</p>
                            </div>
                        </div>
                        <UserNav />
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Package className="h-12 w-12 mx-auto text-gray-400 animate-pulse" />
                        <p className="mt-4 text-gray-600">Loading shipment data...</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
