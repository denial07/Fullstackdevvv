"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import ImportExcelDialog from "@/components/imports/ImportExcelDialog";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    ArrowLeft,
    CalendarIcon,
    Save,
    Plus,
    Trash2,
    Upload,
} from "lucide-react";

import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ShipmentItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
}

type OtherField = { id: string; key: string; value: string };

const STATUS_OPTIONS = [
    "Processing",
    "In Transit",
    "Customs Clearance",
    "Delayed",
    "Arrived",
    "Delivered",
] as const;

function smartParse(input: string): any {
    if (input.trim() === "") return "";
    // boolean
    if (/^(true|false)$/i.test(input)) return input.toLowerCase() === "true";
    // number
    const asNum = Number(input);
    if (!Number.isNaN(asNum) && input.trim() !== "") return asNum;
    // ISO-ish date
    const d = new Date(input);
    if (!Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(input)) return d.toISOString();
    // JSON object/array/quoted string
    if (/^[\[\{"]/.test(input.trim())) {
        try {
            return JSON.parse(input);
        } catch {
            // noop
        }
    }
    return input;
}

export default function AddShipmentPage() {
    const router = useRouter();

    const [shipmentType, setShipmentType] = useState<"incoming" | "internal" | "">("");
    const [status, setStatus] = useState<string>("In Transit"); // sensible default for new incoming
    const [shippingDate, setShippingDate] = useState<Date>();
    const [expectedDate, setExpectedDate] = useState<Date>();
    const [isLoading, setIsLoading] = useState(false);

    const [items, setItems] = useState<ShipmentItem[]>([
        { id: "1", description: "", quantity: 0, unit: "m³", unitPrice: 0 },
    ]);

    // Core fields (kept but you can extend via Other Attributes)
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
        transfer_shipment_id: "", // optional dedupe key for your inventory sync
    });

    // Dynamic “Other Attributes”
    const [otherFields, setOtherFields] = useState<OtherField[]>([
        // start empty; user can add any keys they need
    ]);

    const addOtherField = () => {
        setOtherFields((prev) => [
            ...prev,
            { id: `fld-${Date.now()}`, key: "", value: "" },
        ]);
    };

    const removeOtherField = (id: string) => {
        setOtherFields((prev) => prev.filter((f) => f.id !== id));
    };

    const updateOtherField = (id: string, patch: Partial<OtherField>) => {
        setOtherFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    };

    const addItem = () => {
        const newItem: ShipmentItem = {
            id: Date.now().toString(),
            description: "",
            quantity: 0,
            unit: "m³",
            unitPrice: 0,
        };
        setItems((prev) => [...prev, newItem]);
    };

    const removeItem = (id: string) => {
        setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
    };

    const updateItem = (id: string, field: keyof ShipmentItem, value: any) => {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    };

    const calculateTotal = useMemo(() => {
        return items.reduce((total, item) => total + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
    }, [items]);

    const buildPayload = () => {
        // Base id (user entered or generated)
        const id =
            formData.shipmentId ||
            `SH-${shipmentType === "incoming" ? "IN" : "OUT"}-${Date.now()}`;

        // Start with core predictable fields
        const base: Record<string, any> = {
            id,
            type: shipmentType,
            status,
            vendor: formData.vendor || "",
            customer: formData.customer || "",
            trackingNumber: formData.trackingNumber || "",
            vessel: formData.vessel || "",
            driver: formData.driver || "",
            vehicle: formData.vehicle || "",
            port: formData.port || "",
            address: formData.address || "",
            priority: formData.priority || "Standard",
            notes: formData.notes || "",
            transfer_shipment_id: formData.transfer_shipment_id || undefined,
            shippingDate: shippingDate ? shippingDate.toISOString() : undefined,
            arrival: expectedDate ? expectedDate.toISOString() : undefined, // you used "arrival" earlier
            description: items.map((i) => `${i.description} x ${i.quantity}`).join(", "),
            items,
            price: calculateTotal,
        };

        // Merge dynamic attributes (skip empty keys)
        for (const f of otherFields) {
            const k = f.key.trim();
            if (!k) continue;
            base[k] = smartParse(f.value);
        }

        // Clean undefined so payload is tidy
        Object.keys(base).forEach((k) => base[k] === undefined && delete base[k]);
        return base;
    };

    const handleSubmit: React.FormEventHandler = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = buildPayload();

            const res = await fetch("/api/shipments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error("❌ Shipment create failed:", err);
                throw new Error("Failed to create shipment");
            }

            const created = await res.json();
            console.log("✅ Shipment saved:", created);
            alert("✅ Shipment added!");
            router.push("/shipments");
        } catch (err) {
            console.error(err);
            alert("❌ Add failed.");
        } finally {
            setIsLoading(false);
        }
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
                                    Create a new incoming or internal shipment
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    <Label>Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUS_OPTIONS.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {s}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Shipment Type</Label>
                                    <Select
                                        value={shipmentType}
                                        onValueChange={(value: "incoming" | "internal") => setShipmentType(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select shipment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="incoming">Incoming Shipment</SelectItem>
                                            <SelectItem value="internal">Internal Shipment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="transfer_shipment_id">Transfer Shipment ID (optional)</Label>
                                    <Input
                                        id="transfer_shipment_id"
                                        placeholder="e.g. TR-2025-001"
                                        value={formData.transfer_shipment_id}
                                        onChange={(e) => setFormData({ ...formData, transfer_shipment_id: e.target.value })}
                                    />
                                </div>

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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {shipmentType === "incoming" ? (
                                    <>
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
                                            <Select
                                                value={formData.port}
                                                onValueChange={(value) => setFormData({ ...formData, port: value })}
                                            >
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
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}

                                <div className="space-y-2 md:col-span-3">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea
                                        id="address"
                                        placeholder="Enter address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipment Items</CardTitle>
                            <CardDescription>Add items being shipped</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {items.map((item) => (
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
                                                <SelectItem value="units">Units</SelectItem>
                                                <SelectItem value="shipment">Shipment</SelectItem>
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
                                    <p className="text-lg font-semibold">
                                        Total Value: S${calculateTotal.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Other Attributes (fully dynamic) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Other Attributes</CardTitle>
                            <CardDescription>Add any extra fields you want to store on this shipment</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {otherFields.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No additional fields yet. Click “Add Attribute” to include any custom data (e.g. <code>containerNo</code>, <code>customsRef</code>, <code>hazmat</code>, etc).
                                </p>
                            )}
                            {otherFields.map((f) => (
                                <div key={f.id} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                    <div className="md:col-span-2">
                                        <Label>Key</Label>
                                        <Input
                                            placeholder="e.g. containerNo"
                                            value={f.key}
                                            onChange={(e) => updateOtherField(f.id, { key: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <Label>Value</Label>
                                        <Input
                                            placeholder='Try values like 123, true, 2025-08-19, {"a":1}'
                                            value={f.value}
                                            onChange={(e) => updateOtherField(f.id, { value: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-5 flex justify-end -mt-1">
                                        <Button variant="outline" size="sm" type="button" onClick={() => removeOtherField(f.id)}>
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-2">
                                <Button type="button" variant="outline" onClick={addOtherField}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Attribute
                                </Button>
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
    );
}
