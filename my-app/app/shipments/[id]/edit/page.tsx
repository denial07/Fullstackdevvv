"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CalendarIcon, Save, Plus, Trash2, Edit, Package } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import { useParams } from "next/navigation"

interface ShipmentItem {
    id: string
    description: string
    quantity: number
    unit: string
    unitPrice: number
}

interface ShipmentData {
    id: string
    type: "incoming" | "outgoing"
    status: string
    shipmentId: string
    vendor?: string
    customer?: string
    trackingNumber: string
    vessel?: string
    driver?: string
    vehicle?: string
    port?: string
    address?: string
    priority: string
    notes: string
    shippingDate: Date
    expectedDate: Date
    items: ShipmentItem[]
    createdAt: Date
    updatedAt: Date
}

export default function EditShipmentPage() {
    const params = useParams()
    const shipmentId = params.id as string

    const [isLoading, setIsLoading] = useState(false)
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [shipmentData, setShipmentData] = useState<ShipmentData | null>(null)
    const [shippingDate, setShippingDate] = useState<Date>()
    const [expectedDate, setExpectedDate] = useState<Date>()
    const [items, setItems] = useState<ShipmentItem[]>([])

    const [formData, setFormData] = useState({
        shipmentId: "",
        type: "",
        vendor: "",
        customer: "",
        trackingNumber: "",
        vessel: "",
        driver: "",
        vehicle: "",
        port: "",
        address: "",
        priority: "Standard",
        notes: "",
    })

    // ...existing code...
    useEffect(() => {
        const loadShipmentData = async () => {
            setIsDataLoading(true)

            try {
                const res = await fetch(`/api/shipments/${shipmentId}`)
                if (!res.ok) throw new Error("Failed to load shipment")

                const data = await res.json()
                console.log("✅ Fetched shipment data:", data)

                setShipmentData(data)

                // Defensive check in case dates are invalid or missing
                setShippingDate(data.shippingDate ? new Date(data.shippingDate) : undefined)
                // FIX: Use data.expectedDate if available, else fallback to data.arrival
                setExpectedDate(
                    data.expectedDate
                        ? new Date(data.expectedDate)
                        : data.arrival
                            ? new Date(data.arrival)
                            : undefined
                )

                setFormData({
                    shipmentId: data.shipmentId,
                    type: data.type,
                    vendor: data.vendor || "",
                    customer: data.customer || "",
                    trackingNumber: data.trackingNumber || "",
                    vessel: data.vessel || "",
                    driver: data.driver || "",
                    vehicle: data.vehicle || "",
                    port: data.port || "",
                    address: data.address || "",
                    priority: data.priority || "Standard",
                    notes: data.notes || "",
                })

                setItems(data.items || [])
            } catch (err) {
                console.error("❌ Failed to fetch shipment:", err)
                setShipmentData(null)
            } finally {
                setIsDataLoading(false)
            }
        }

        loadShipmentData()
    }, [shipmentId])
    // ...existing code...

    const addItem = () => {
        const newItem: ShipmentItem = {
            id: Date.now().toString(),
            description: "",
            quantity: 0,
            unit: "m³",
            unitPrice: 0,
        }
        setItems([...items, newItem])
    }

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id))
        }
    }

    const updateItem = (id: string, field: keyof ShipmentItem, value: any) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
    }

    const calculateTotal = () => {
        return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const payload = {
            shipmentId: formData.shipmentId,
            type: formData.type,
            vendor: formData.vendor,
            customer: formData.customer,
            trackingNumber: formData.trackingNumber,
            vessel: formData.vessel,
            driver: formData.driver,
            vehicle: formData.vehicle,
            port: formData.port,
            address: formData.address,
            priority: formData.priority,
            notes: formData.notes,
            shippingDate: shippingDate?.toISOString(),
            arrival: expectedDate?.toISOString(),
            price: calculateTotal(),
            items,
        }

        try {
            const res = await fetch(`/api/shipments/${shipmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error("Failed to update shipment")

            setIsLoading(false)
            alert("✅ Shipment updated successfully!")
            window.location.href = "/shipments"
        } catch (err) {
            console.error(err)
            alert("❌ Update failed.")
            setIsLoading(false)
        }

    }

    if (isDataLoading) {
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

    if (!shipmentData) {
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
                                    <p className="text-gray-600">Shipment not found</p>
                                </div>
                            </div>
                            <UserNav />
                        </div>
                    </div>
                </header>
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardContent className="text-center py-12">
                            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Shipment Not Found</h3>
                            <p className="text-gray-600 mb-4">The shipment you're looking for doesn't exist or has been removed.</p>
                            <Button asChild>
                                <Link href="/shipments">Return to Shipments</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </main>
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
                                <Link href="/shipments">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Shipments
                                </Link>
                            </Button>
                            <div>
                                <div className="flex items-center space-x-3">
                                    <h1 className="text-3xl font-bold text-gray-900">Edit Shipment</h1>
                                    <Badge
                                        variant={
                                            shipmentData.status === "Delivered"
                                                ? "default"
                                                : shipmentData.status === "Delayed"
                                                    ? "destructive"
                                                    : "secondary"
                                        }
                                    >
                                        {shipmentData.status}
                                    </Badge>
                                </div>
                                <p className="text-gray-600">Modify shipment details for {shipmentData.shipmentId}</p>
                            </div>
                        </div>
                        <UserNav />
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Shipment Info Banner */}
                <Card className="mb-6">
                    <CardContent className="py-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Created</p>
                                <p className="font-medium">
                                    {shipmentData.createdAt
                                        ? format(new Date(shipmentData.createdAt), "PPP")
                                        : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Last Updated</p>
                                <p className="font-medium">
                                    {shipmentData.updatedAt
                                        ? format(new Date(shipmentData.updatedAt), "PPP")
                                        : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Type</p>
                                <p className="font-medium capitalize">{shipmentData.type}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Current Value</p>
                                <p className="font-medium">
                                    S${calculateTotal()?.toLocaleString() ?? "0"}
                                </p>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Edit className="h-5 w-5 mr-2" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>Update the basic shipment details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shipmentId">Shipment ID</Label>
                                    <Input
                                        id="shipmentId"
                                        value={formData.shipmentId}
                                        onChange={(e) => setFormData({ ...formData, shipmentId: e.target.value })}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                    <p className="text-xs text-gray-500">Shipment ID cannot be changed</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Shipment Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: "incoming" | "outgoing") => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="incoming">Incoming Shipment</SelectItem>
                                            <SelectItem value="outgoing">Outgoing Shipment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.type === "incoming" ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="vendor">Vendor/Supplier</Label>
                                        <Select
                                            value={formData.vendor}
                                            onValueChange={(value) => setFormData({ ...formData, vendor: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select vendor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="malaysian-timber">Malaysian Timber Co.</SelectItem>
                                                <SelectItem value="indonesian-wood">Indonesian Wood Supply</SelectItem>
                                                <SelectItem value="thai-forest">Thai Forest Products</SelectItem>
                                                <SelectItem value="vietnamese-lumber">Vietnamese Lumber Ltd.</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="customer">Customer</Label>
                                        <Select
                                            value={formData.customer}
                                            onValueChange={(value) => setFormData({ ...formData, customer: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select customer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="abc-logistics">ABC Logistics Pte Ltd</SelectItem>
                                                <SelectItem value="singapore-shipping">Singapore Shipping Co.</SelectItem>
                                                <SelectItem value="maritime-solutions">Maritime Solutions Ltd</SelectItem>
                                                <SelectItem value="global-trade">Global Trade Hub</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="trackingNumber">Tracking Number</Label>
                                    <Input
                                        id="trackingNumber"
                                        placeholder="Enter tracking number"
                                        value={formData.trackingNumber}
                                        onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Shipping Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {shippingDate instanceof Date && !isNaN(shippingDate.getTime()) ? format(shippingDate, "PPP") : "Select shipping date"}

                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={shippingDate} onSelect={setShippingDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>Expected {formData.type === "incoming" ? "Arrival" : "Delivery"} Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {expectedDate instanceof Date && !isNaN(expectedDate.getTime()) ? format(expectedDate, "PPP") : "Select expected date"}

                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={expectedDate} onSelect={setExpectedDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transport Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transport Details</CardTitle>
                            <CardDescription>
                                {formData.type === "incoming" ? "Vessel and port information" : "Driver and vehicle information"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.type === "incoming" ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="vessel">Vessel Name</Label>
                                        <Input
                                            id="vessel"
                                            placeholder="Enter vessel name"
                                            value={formData.vessel}
                                            onChange={(e) => setFormData({ ...formData, vessel: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="port">Port of Entry</Label>
                                        <Select value={formData.port} onValueChange={(value) => setFormData({ ...formData, port: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select port" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="port-singapore">Port of Singapore</SelectItem>
                                                <SelectItem value="jurong-port">Jurong Port</SelectItem>
                                                <SelectItem value="pasir-panjang">Pasir Panjang Terminal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="driver">Driver Name</Label>
                                        <Input
                                            id="driver"
                                            placeholder="Enter driver name"
                                            value={formData.driver}
                                            onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vehicle">Vehicle Number</Label>
                                        <Input
                                            id="vehicle"
                                            placeholder="Enter vehicle number"
                                            value={formData.vehicle}
                                            onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="address">Delivery Address</Label>
                                        <Textarea
                                            id="address"
                                            placeholder="Enter delivery address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipment Items</CardTitle>
                            <CardDescription>Modify items being shipped</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                                    <div className="md:col-span-2">
                                        <Label>Item Description</Label>
                                        <Input
                                            placeholder="Enter item description"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={item.quantity || ""}
                                            onChange={(e) => updateItem(item.id, "quantity", Number.parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Unit</Label>
                                        <Select value={item.unit} onValueChange={(value) => updateItem(item.id, "unit", value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="m³">m³</SelectItem>
                                                <SelectItem value="pcs">Pieces</SelectItem>
                                                <SelectItem value="kg">Kilograms</SelectItem>
                                                <SelectItem value="tons">Tons</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Unit Price (S$)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={item.unitPrice || ""}
                                            onChange={(e) => updateItem(item.id, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeItem(item.id)}
                                            disabled={items.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-between items-center">
                                <Button type="button" variant="outline" onClick={addItem}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </Button>
                                <div className="text-right">
                                    <p className="text-lg font-semibold">Total Value: S${calculateTotal().toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                            <CardDescription>Priority and special notes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Standard">Standard</SelectItem>
                                            <SelectItem value="High">High Priority</SelectItem>
                                            <SelectItem value="Urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Special Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Enter any special instructions or notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/shipments">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            <Save className="h-4 w-4 mr-2" />
                            {isLoading ? "Updating Shipment..." : "Update Shipment"}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    )
}
