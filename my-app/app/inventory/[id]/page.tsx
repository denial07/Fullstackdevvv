"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, Send, Building2, MapPin, Mail, Package, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"

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
      return "bg-green-100 text-green-800"
    case "Low Stock":
      return "bg-yellow-100 text-yellow-800"
    case "Expiring Soon":
      return "bg-orange-100 text-orange-800"
    case "Expired":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
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
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const router = useRouter()
  const material = materialData[params.id]

  if (!material) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Material Not Found</h1>
          <Link
            href="/inventory"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Link>
        </div>
      </div>
    )
  }

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true)

    // Show loading toast
    const loadingToast = toast.loading("Placing your order...", {
      description: "Please wait while we process your order",
    })

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Dismiss loading toast
      toast.dismiss(loadingToast)

      // Show success toast
      toast.success("Order Placed Successfully! 🎉", {
        description: `Order for ${material.suggestedOrder} ${material.unit} of ${material.name} has been placed with ${material.supplier}.`,
        duration: 4000,
        action: {
          label: "View Orders",
          onClick: () => console.log("View orders clicked"),
        },
      })

      setShowOrderDialog(false)

      // Redirect to inventory page after a short delay
      setTimeout(() => {
        router.push("/inventory")
      }, 2000)
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast)

      // Show error toast
      toast.error("Order Failed", {
        description: "There was an error placing your order. Please try again.",
        duration: 4000,
      })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const totalOrderValue = material.suggestedOrder * material.costPerUnit

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Material Header - moved below navbar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">Material: {material.name}</h1>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(material.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(material.status)}`}>
                    {material.status}
                  </span>
                </div>
              </div>
              <p className="text-gray-600">Item ID: {material.id}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Material and Company Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Material Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Material Information</h2>
              <div className="space-y-4">
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
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Company Information
              </h2>
              <div className="space-y-4">
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
              </div>
            </div>

            {/* Order Suggestion */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">
                    Suggestion: Order {material.suggestedOrder} {material.unit}
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Current stock is below minimum threshold. Recommended reorder quantity based on usage patterns.
                  </p>
                  <p className="text-sm text-orange-600 mt-2 font-medium">
                    Total Order Value: S${totalOrderValue.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderDialog(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                >
                  Place Order
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Chat Interface */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
              <div className="p-4 border-b">
                <h2 className="font-semibold flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Company Chat
                </h2>
              </div>
              <div className="flex-1 flex flex-col p-4">
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
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type something here..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Order Confirmation Dialog */}
      {showOrderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Package className="h-5 w-5 mr-2 text-orange-600" />
              <h3 className="text-lg font-semibold">Confirm Order Placement</h3>
            </div>

            <div className="space-y-3 mb-6">
              <p>Are you sure you want to place this order?</p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Material:</span>
                  <span>{material.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Quantity:</span>
                  <span>
                    {material.suggestedOrder} {material.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Supplier:</span>
                  <span>{material.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Unit Price:</span>
                  <span>S${material.costPerUnit}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Value:</span>
                  <span className="text-orange-600">S${totalOrderValue.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                This order will be sent to {material.supplier} and you will receive a confirmation email shortly.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowOrderDialog(false)}
                disabled={isPlacingOrder}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isPlacingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Placing Order...
                  </>
                ) : (
                  "Confirm Order"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
