"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import ImportExcelDialog from "@/components/imports/ImportExcelDialog";


import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, CalendarIcon, Save, Plus, Trash2, Upload } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"

interface ShipmentItem {
    id: string
    description: string
    quantity: number
    unit: string
    unitPrice: number
}

export default function AddShipmentPage() {
    const [shipmentType, setShipmentType] = useState<"incoming" | "outgoing" | "">("")
    const [shippingDate, setShippingDate] = useState<Date>()
    const [expectedDate, setExpectedDate] = useState<Date>()
    const [isLoading, setIsLoading] = useState(false)
    const [items, setItems] = useState<ShipmentItem[]>([
        { id: "1", description: "", quantity: 0, unit: "m³", unitPrice: 0 },
    ])

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
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            id: formData.shipmentId || `SH-${shipmentType === "incoming" ? "IN" : "OUT"}-${Date.now()}`,
            type: shipmentType,
            vendor: formData.vendor || "",           // only if incoming
            customer: formData.customer || "",       // only if outgoing
            description: items.map((i) => `${i.description} x ${i.quantity}`).join(", "),
            status: shipmentType === "incoming" ? "In Transit" : "Preparing",
            arrival: expectedDate?.toISOString(),    // matches "arrival" field
            price: calculateTotal(),
        };

        const res = await fetch("/api/shipments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const error = await res.json();
            console.error("❌ Shipment create failed:", error);
            throw new Error("Failed to create shipment");
        }

        const createdShipment = await res.json();
        console.log("✅ Shipment saved:", createdShipment);
        setIsLoading(false);
    };


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-6">
                        {/* Left: back + title */}
                        <div className="flex items-center gap-4 min-w-0">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/shipments">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Shipments
                                </Link>
                            </Button>
                            <div className="min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    Add New Shipment
                                </h1>
                                <p className="text-gray-600 truncate">
                                    Create a new incoming or outgoing shipment
                                </p>
                            </div>
                        </div>

                        {/* Right: actions (Import + User) */}
                        <div className="flex items-center gap-2">
                            <ImportExcelDialog
                                entity="Shipment"
                                onCommitted={() => router.refresh?.()}
                                trigger={
                                    <Button variant="secondary" size="sm">
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import Excel
                                    </Button>
                                }
                            />
                            <UserNav />
                        </div>
                    </div>
                </div>
            </header>


            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Enter the basic shipment details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shipmentId">Shipment ID</Label>
                                    <Input
                                        id="shipmentId"
                                        placeholder="Auto-generated if empty"
                                        value={formData.shipmentId}
                                        onChange={(e) => setFormData({ ...formData, shipmentId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Shipment Type</Label>
                                    <Select
                                        value={shipmentType}
                                        onValueChange={(value: "incoming" | "outgoing") => setShipmentType(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select shipment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="incoming">Incoming Shipment</SelectItem>
                                            <SelectItem value="outgoing">Outgoing Shipment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {shipmentType === "incoming" ? (
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
                                                {shippingDate ? format(shippingDate, "PPP") : "Select shipping date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={shippingDate} onSelect={setShippingDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>Expected {shipmentType === "incoming" ? "Arrival" : "Delivery"} Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {expectedDate ? format(expectedDate, "PPP") : "Select expected date"}
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
                                {shipmentType === "incoming" ? "Vessel and port information" : "Driver and vehicle information"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {shipmentType === "incoming" ? (
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
                            <CardDescription>Add items being shipped</CardDescription>
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
                            {isLoading ? "Adding Shipment..." : "Add Shipment"}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    )
}
