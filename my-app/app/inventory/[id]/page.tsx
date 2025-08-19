"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { Building2, MapPin, Mail, Package, AlertTriangle, CheckCircle, Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface InventoryItem {
  _id: string
  id: string
  item: string
  category: string
  quantity: number
  unit: string
  minStock: number
  maxStock: number
  location: string
  receivedDate: string
  expiryDate: string
  supplier: string
  costPerUnit: number
  status: string
}

// Enhanced material data with supplier details based on existing suppliers
const SUPPLIER_DETAILS = {
  "Malaysian Timber Co.": {
    location: "Kuala Lumpur, Malaysia",
    email: "contact@malaytimber.com",
    country: "Malaysia",
  },
  "Indonesian Wood Supply": {
    location: "Jakarta, Indonesia",
    email: "orders@indowood.co.id",
    country: "Indonesia",
  },
  "Thai Forest Products": {
    location: "Bangkok, Thailand",
    email: "sales@thaiforest.com",
    country: "Thailand",
  },
  "Vietnamese Lumber Ltd.": {
    location: "Ho Chi Minh City, Vietnam",
    email: "info@vietnamlumber.com",
    country: "Vietnam",
  },
  "Canadian Wood Co.": {
    location: "Vancouver, Canada",
    email: "sales@canadianwood.ca",
    country: "Canada",
  },
  "Nordic Timber Ltd.": {
    location: "Stockholm, Sweden",
    email: "orders@nordictimber.se",
    country: "Sweden",
  },
  "Industrial Wood Co.": {
    location: "Singapore",
    email: "contact@industrialwood.sg",
    country: "Singapore",
  },
} as const

// Material descriptions based on category and type
const MATERIAL_DESCRIPTIONS = {
  "Teak Wood Planks":
    "Premium quality teak wood planks sourced from sustainable forests. Ideal for high-end furniture and construction projects with excellent durability and natural weather resistance.",
  "Pine Wood Boards":
    "High-quality pine wood boards perfect for construction and carpentry work. Sustainably sourced with consistent grain patterns and excellent workability.",
  "Oak Wood Sheets":
    "Premium oak wood sheets with excellent grain patterns. Perfect for furniture making and interior design applications with superior strength and beautiful finish.",
  "Bamboo Planks":
    "Eco-friendly bamboo planks offering sustainable alternative to traditional hardwoods. Fast-growing renewable resource with excellent strength-to-weight ratio.",
  "Mahogany Boards":
    "Luxury mahogany boards with rich color and fine grain. Ideal for high-end furniture, cabinetry, and decorative applications with natural resistance to decay.",
  "Plywood Sheets":
    "Engineered plywood sheets offering consistent quality and dimensional stability. Perfect for construction, furniture making, and various industrial applications.",
  "Cedar Planks":
    "Aromatic cedar planks with natural insect-repelling properties. Excellent for outdoor applications, closets, and specialty woodworking projects.",
  "Birch Wood Panels":
    "High-quality birch panels with smooth surface and consistent grain. Ideal for furniture making, cabinetry, and interior finishing applications.",
  "Rubber Wood Blocks":
    "Sustainable rubber wood blocks from plantation trees. Eco-friendly option with good workability and consistent quality for furniture and construction.",
  "MDF Boards":
    "Medium-density fiberboard offering smooth surface and consistent density. Perfect for painted finishes, furniture components, and interior applications.",
  "Acacia Wood Strips":
    "Durable acacia wood strips with attractive grain patterns. Excellent for flooring, furniture, and decorative applications with natural durability.",
  "Particle Board":
    "Cost-effective particle board for interior applications. Suitable for furniture components, shelving, and construction where painted finishes are desired.",
} as const

// Material specifications based on type
const MATERIAL_SPECIFICATIONS = {
  "Teak Wood Planks": { density: "0.65 g/cm³", moisture: "12-15%", grade: "Grade A", treatment: "Kiln Dried" },
  "Pine Wood Boards": { density: "0.45 g/cm³", moisture: "10-12%", grade: "Grade B", treatment: "Air Dried" },
  "Oak Wood Sheets": { density: "0.75 g/cm³", moisture: "8-10%", grade: "Grade A+", treatment: "Kiln Dried" },
  "Bamboo Planks": { density: "0.60 g/cm³", moisture: "8-12%", grade: "Grade A", treatment: "Carbonized" },
  "Mahogany Boards": { density: "0.70 g/cm³", moisture: "10-14%", grade: "Grade A", treatment: "Kiln Dried" },
  "Plywood Sheets": { density: "0.55 g/cm³", moisture: "8-12%", grade: "Grade B", treatment: "Pressed" },
  "Cedar Planks": { density: "0.35 g/cm³", moisture: "12-16%", grade: "Grade A", treatment: "Air Dried" },
  "Birch Wood Panels": { density: "0.65 g/cm³", moisture: "8-10%", grade: "Grade A", treatment: "Kiln Dried" },
  "Rubber Wood Blocks": { density: "0.58 g/cm³", moisture: "10-12%", grade: "Grade B", treatment: "Kiln Dried" },
  "MDF Boards": { density: "0.75 g/cm³", moisture: "6-8%", grade: "Standard", treatment: "Pressed" },
  "Acacia Wood Strips": { density: "0.68 g/cm³", moisture: "8-12%", grade: "Grade A", treatment: "Kiln Dried" },
  "Particle Board": { density: "0.65 g/cm³", moisture: "6-10%", grade: "Standard", treatment: "Pressed" },
} as const

const DEFAULT_SPECIFICATION = { density: "0.60 g/cm³", moisture: "8-12%", grade: "Grade B", treatment: "Standard" }

const getStatusColor = (status: string) => {
  switch (status) {
    case "Good": return "bg-green-100 text-green-800"
    case "Low Stock": return "bg-yellow-100 text-yellow-800"
    case "Expiring Soon": return "bg-orange-100 text-orange-800"
    case "Expired": return "bg-red-100 text-red-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Good": return <CheckCircle className="h-4 w-4" />
    case "Low Stock": return <Package className="h-4 w-4" />
    case "Expiring Soon": return <AlertTriangle className="h-4 w-4" />
    case "Expired": return <AlertTriangle className="h-4 w-4" />
    default: return <Package className="h-4 w-4" />
  }
}

const calculateSuggestedOrder = (currentStock: number, minStock: number, maxStock: number): number => {
  if (currentStock <= minStock) {
    return maxStock - currentStock
  }
  if (currentStock < maxStock * 0.75) {
    return Math.ceil((maxStock - currentStock) * 0.8)
  }
  return Math.ceil(maxStock * 0.3)
}

const calculateActualStatus = (quantity: number, minStock: number, maxStock: number, expiryDate: string): string => {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return "Expired"
  if (daysUntilExpiry <= 30) return "Expiring Soon"
  
  if (quantity < minStock) return "Low Stock"
  
  return "Good"
}

export default function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [material, setMaterial] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchMaterial()
    }
  }, [resolvedParams?.id])

  const fetchMaterial = async () => {
    if (!resolvedParams?.id) return
    
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/inventory/${resolvedParams.id}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError("Material not found")
        } else {
          const errorData = await response.json()
          throw new Error(`${errorData.error}: ${errorData.details || ""}`)
        }
        return
      }

      const data = await response.json()
      const actualStatus = calculateActualStatus(data.quantity, data.minStock, data.maxStock, data.expiryDate)
      const updatedMaterial = { ...data, status: actualStatus }
      setMaterial(updatedMaterial)
    } catch (err: any) {
      console.error("❌ Error fetching material:", err)
      setError(err.message || "An error occurred while fetching material details")
    } finally {
      setLoading(false)
    }
  }

  // Memoize expensive calculations
  const materialData = useMemo(() => {
    if (!material) return null
    
    const supplierInfo = SUPPLIER_DETAILS[material.supplier as keyof typeof SUPPLIER_DETAILS] || {
      location: "Location not available",
      email: "contact@supplier.com",
      country: "Unknown",
    }

    const description = MATERIAL_DESCRIPTIONS[material.item as keyof typeof MATERIAL_DESCRIPTIONS] ||
      `High-quality ${material.category.toLowerCase()} material suitable for various construction and woodworking applications.`
    
    const specifications = MATERIAL_SPECIFICATIONS[material.item as keyof typeof MATERIAL_SPECIFICATIONS] || DEFAULT_SPECIFICATION
    const suggestedOrder = calculateSuggestedOrder(material.quantity, material.minStock, material.maxStock)
    const totalOrderValue = suggestedOrder * material.costPerUnit

    return {
      supplierInfo,
      description,
      specifications,
      suggestedOrder,
      totalOrderValue
    }
  }, [material])

  const handlePlaceOrder = async () => {
    if (!material || !materialData) return

    setIsPlacingOrder(true)
    const loadingToast = toast.loading("Placing your order...", {
      description: "Please wait while we process your order",
    })

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.dismiss(loadingToast)

      toast.success("Order Placed Successfully! 🎉", {
        description: `Order for ${materialData.suggestedOrder} ${material.unit} of ${material.item} has been placed with ${material.supplier}.`,
        duration: 4000,
        action: {
          label: "View Orders",
          onClick: () => console.log("View orders clicked"),
        },
      })

      setShowOrderDialog(false)
      setTimeout(() => {
        router.push("/inventory")
      }, 2000)
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error("Order Failed", {
        description: "There was an error placing your order. Please try again.",
        duration: 4000,
      })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium">Loading material details...</p>
              <p className="text-sm text-gray-500">Fetching data from database...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Material Not Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">{error}</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Possible Issues:</h4>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                  <li>The material ID may not exist in the database</li>
                  <li>The material may have been deleted</li>
                  <li>Database connection issues</li>
                  <li>Check if the inventory has been seeded with data</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button onClick={fetchMaterial} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push("/inventory")} className="flex-1">
                  Back to Inventory
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!material || !materialData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Material Header - moved below navbar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">Material: {material.item}</h1>
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
        <div className="grid grid-cols-1 gap-8">
          {/* Material and Company Info */}
          <div className="space-y-6">
            {/* Material Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Material Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name:</label>
                    <p className="text-lg font-semibold">{material.item}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category:</label>
                    <p className="text-lg">{material.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Origin:</label>
                    <p className="text-lg">{materialData.supplierInfo.country}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Warehouse:</label>
                    <p className="text-lg">{material.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Stock:</label>
                    <p className="text-lg">
                      {material.quantity} {material.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cost per Unit:</label>
                    <p className="text-lg">S${material.costPerUnit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Min Stock:</label>
                    <p className="text-lg">
                      {material.minStock} {material.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Max Stock:</label>
                    <p className="text-lg">
                      {material.maxStock} {material.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Received Date:</label>
                    <p className="text-lg">{material.receivedDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expiry Date:</label>
                    <p className="text-lg">{material.expiryDate}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Description:</label>
                  <p className="text-gray-700 mt-1">{materialData.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Specifications:</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {Object.entries(materialData.specifications).map(([key, value]) => (
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
                  <p className="text-lg">{materialData.supplierInfo.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email:
                  </label>
                  <p className="text-lg">{materialData.supplierInfo.email}</p>
                </div>
              </div>
            </div>

            {/* Order Suggestion */}
            {material.quantity <= material.minStock && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-900">
                      Suggestion: Order {materialData.suggestedOrder} {material.unit}
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Current stock is below minimum threshold. Recommended reorder quantity based on usage patterns.
                    </p>
                    <p className="text-sm text-orange-600 mt-2 font-medium">
                      Total Order Value: S${materialData.totalOrderValue.toLocaleString()}
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
            )}
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
                  <span>{material.item}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Quantity:</span>
                  <span>
                    {materialData.suggestedOrder} {material.unit}
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
                  <span className="text-orange-600">S${materialData.totalOrderValue.toLocaleString()}</span>
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
