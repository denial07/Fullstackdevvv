import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Building2, MapPin, Mail, Package, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"

// Mock data for different materials
const materialData: Record<string, any> = {
  "INV-001": {
    id: "INV-001",
    name: "Teak Wood Planks",
    category: "Hardwood",
    quantity: 45,
    unit: "m³",
    status: "Low Stock",
    origin: "Malaysia",
    warehouse: "Warehouse A-1",
    supplier: "Malaysian Timber Co.",
    supplierLocation: "Kuala Lumpur, Malaysia",
    supplierEmail: "contact@malaytimber.com",
    minStock: 50,
    currentStock: 45,
    suggestedOrder: 100,
    costPerUnit: 850,
    description:
      "Premium quality teak wood planks sourced from sustainable Malaysian forests. Ideal for high-end furniture and construction projects.",
    specifications: {
      density: "0.65 g/cm³",
      moisture: "12-15%",
      grade: "Grade A",
      treatment: "Kiln Dried",
    },
  },
  "INV-002": {
    id: "INV-002",
    name: "Pine Wood Boards",
    category: "Softwood",
    quantity: 12,
    unit: "m³",
    status: "Expiring Soon",
    origin: "Indonesia",
    warehouse: "Warehouse B-2",
    supplier: "Indonesian Wood Supply",
    supplierLocation: "Jakarta, Indonesia",
    supplierEmail: "orders@indowood.co.id",
    minStock: 30,
    currentStock: 12,
    suggestedOrder: 300,
    costPerUnit: 420,
    description:
      "High-quality pine wood boards perfect for construction and carpentry work. Sustainably sourced from Indonesian plantations.",
    specifications: {
      density: "0.45 g/cm³",
      moisture: "10-12%",
      grade: "Grade B",
      treatment: "Air Dried",
    },
  },
  "INV-003": {
    id: "INV-003",
    name: "Oak Wood Sheets",
    category: "Hardwood",
    quantity: 8,
    unit: "m³",
    status: "Expired",
    origin: "Thailand",
    warehouse: "Warehouse A-3",
    supplier: "Thai Forest Products",
    supplierLocation: "Bangkok, Thailand",
    supplierEmail: "sales@thaiforest.com",
    minStock: 25,
    currentStock: 8,
    suggestedOrder: 150,
    costPerUnit: 920,
    description:
      "Premium oak wood sheets with excellent grain patterns. Perfect for furniture making and interior design applications.",
    specifications: {
      density: "0.75 g/cm³",
      moisture: "8-10%",
      grade: "Grade A+",
      treatment: "Kiln Dried",
    },
  },
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Good":
      return "default"
    case "Low Stock":
      return "secondary"
    case "Expiring Soon":
      return "destructive"
    case "Expired":
      return "destructive"
    default:
      return "secondary"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Good":
      return <CheckCircle className="h-4 w-4" />
    case "Low Stock":
      return <Package className="h-4 w-4" />
    case "Expiring Soon":
      return <AlertTriangle className="h-4 w-4" />
    case "Expired":
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

export default function MaterialDetailPage({ params }: { params: { id: string } }) {
  const material = materialData[params.id]

  if (!material) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Material Not Found</h1>
          <Button asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/inventory">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Inventory
                </Link>
              </Button>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900">Material: {material.name}</h1>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(material.status)}
                    <Badge variant={getStatusColor(material.status)}>{material.status}</Badge>
                  </div>
                </div>
                <p className="text-gray-600">Item ID: {material.id}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Material and Company Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Material Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Material Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name:</label>
                    <p className="text-lg font-semibold">{material.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category:</label>
                    <p className="text-lg">{material.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Origin:</label>
                    <p className="text-lg">{material.origin}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Warehouse:</label>
                    <p className="text-lg">{material.warehouse}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Stock:</label>
                    <p className="text-lg">
                      {material.currentStock} {material.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cost per Unit:</label>
                    <p className="text-lg">S${material.costPerUnit}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Description:</label>
                  <p className="text-gray-700 mt-1">{material.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Specifications:</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {Object.entries(material.specifications).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 uppercase">{key}</p>
                        <p className="text-sm font-semibold">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name:</label>
                  <p className="text-lg font-semibold">{material.supplier}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Location:
                  </label>
                  <p className="text-lg">{material.supplierLocation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email:
                  </label>
                  <p className="text-lg">{material.supplierEmail}</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Suggestion */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-900">
                      Suggestion: Order {material.suggestedOrder} Units
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Current stock is below minimum threshold. Recommended reorder quantity based on usage patterns.
                    </p>
                  </div>
                  <Button className="bg-orange-600 hover:bg-orange-700">Place Order</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chat Interface */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Company Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Chat Messages Area */}
                <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Company Representative</p>
                      <p className="text-gray-800">Hello! How can I help you with your {material.name} inquiry?</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg shadow-sm ml-8">
                      <p className="text-sm text-gray-600 mb-1">You</p>
                      <p className="text-gray-800">I'd like to know about bulk pricing for this material.</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Company Representative</p>
                      <p className="text-gray-800">
                        For orders above 100 {material.unit}, we offer a 15% discount. Would you like me to prepare a
                        quote?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chat Input */}
                <div className="flex-shrink-0">
                  <div className="flex space-x-2">
                    <Input placeholder="Type something here..." className="flex-1" />
                    <Button size="icon" className="flex-shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
