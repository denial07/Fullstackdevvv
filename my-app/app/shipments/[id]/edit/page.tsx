"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";

import { UserNav } from "@/components/user-nav";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, Save, Plus, Trash2, Edit, Package } from "lucide-react";

/** ---------- Types ---------- */
interface ShipmentItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
}

type AnyRec = Record<string, any>;

/** ---------- Helpers ---------- */
const STATUS_OPTIONS = [
    "Processing",
    "In Transit",
    "Customs Clearance",
    "Delayed",
    "Arrived",
    "Delivered",
];

const READONLY_KEYS = new Set<string>(["_id", "id", "createdAt", "updatedAt"]);
const HIDDEN_KEYS = new Set<string>([]); // add keys here if you want to hide them from the dynamic editor

const isDateKey = (k: string) => /\b(date|eta|arrival|deliveredAt)\b/i.test(k);

/** Compare shallow values (stringify objects/arrays) */
function equalish(a: any, b: any) {
    if (a === b) return true;
    const isObjA = typeof a === "object" && a !== null;
    const isObjB = typeof b === "object" && b !== null;
    if (isObjA || isObjB) {
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return false;
        }
    }
    return false;
}

/** ---------- Component ---------- */
export default function EditShipmentPage() {
    const params = useParams();
    const shipmentId = params.id as string;

    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [original, setOriginal] = useState<AnyRec | null>(null);
    const [draft, setDraft] = useState<AnyRec>({});
    const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());

    // Items get a nice editor; store them separately but also mirror into draft["items"]
    const [items, setItems] = useState<ShipmentItem[]>([]);

    /** -------- Load shipment -------- */
    useEffect(() => {
        (async () => {
            setIsDataLoading(true);
            try {
                const res = await fetch(`/api/shipments/${shipmentId}`);
                if (!res.ok) throw new Error("Failed to load shipment");
                const data: AnyRec = await res.json();

                // Build items from either emailMetadata.items or items on doc
                const itemsSrc: any[] = data?.emailMetadata?.items ?? data?.items ?? [];
                let mapped: ShipmentItem[] = itemsSrc.map((it: any, i: number) => ({
                    id: it.id ?? `item-${i}`,
                    description: it.name ?? it.description ?? "",
                    quantity: Number(it.quantity ?? 0),
                    unit: it.unit ?? "units",
                    unitPrice: Number(it.price ?? it.unitPrice ?? 0),
                }));

                if (mapped.length === 0 && Number(data?.price) > 0) {
                    mapped = [
                        {
                            id: "default-item",
                            description: data.description ?? "Shipment value",
                            quantity: 1,
                            unit: "shipment",
                            unitPrice: Number(data.price),
                        },
                    ];
                }
                if (mapped.length === 0) {
                    mapped = [
                        { id: "empty-item", description: "", quantity: 0, unit: "units", unitPrice: 0 },
                    ];
                }

                setItems(mapped);

                // Seed draft with all keys from the doc (shallow copy), plus normalized convenience fields
                const shallow = { ...data };
                shallow.items = mapped;
                // Ensure status & type exist for editors
                if (!shallow.status) shallow.status = "Processing";
                if (!shallow.type) shallow.type = "incoming";

                // Provide explicit field for transfer_shipment_id (front-end editable)
                if (shallow.transfer_shipment_id == null) shallow.transfer_shipment_id = "";

                setOriginal(data);
                setDraft(shallow);
                setDirtyKeys(new Set());
            } catch (e) {
                console.error("Failed to fetch shipment:", e);
                setOriginal(null);
                setDraft({});
            } finally {
                setIsDataLoading(false);
            }
        })();
    }, [shipmentId]);

    /** ---------- Dirty tracking helpers ---------- */
    const markDirty = (key: string, nextVal: any) => {
        setDraft((d) => ({ ...d, [key]: nextVal }));
        setDirtyKeys((prev) => {
            const next = new Set(prev);
            if (original && !equalish(original[key], nextVal)) next.add(key);
            else next.delete(key);
            return next;
        });
    };

    const markItemsDirty = (nextItems: ShipmentItem[]) => {
        setItems(nextItems);
        setDraft((d) => ({ ...d, items: nextItems }));
        setDirtyKeys((prev) => {
            const next = new Set(prev);
            if (original && !equalish(original.items, nextItems)) next.add("items");
            else next.delete("items");
            return next;
        });
    };

    /** ---------- Derived totals ---------- */
    const itemsTotal = useMemo(
        () => items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0),
        [items]
    );

    const calculateTotal = () => {
        if (itemsTotal > 0) return itemsTotal;
        if (original?.price) return Number(original.price);
        if (original?.emailMetadata?.extractedPrice) return Number(original.emailMetadata.extractedPrice);
        return 0;
    };

    /** ---------- Handlers for items ---------- */
    const addItem = () => {
        const newItem: ShipmentItem = {
            id: `item-${Date.now()}`,
            description: "",
            quantity: 0,
            unit: "m³",
            unitPrice: 0,
        };
        markItemsDirty([...items, newItem]);
    };

    const removeItem = (id: string) => {
        if (items.length <= 1) return;
        markItemsDirty(items.filter((it) => it.id !== id));
    };

    const updateItem = (id: string, field: keyof ShipmentItem, value: any) => {
        const next = items.map((it) => (it.id === id ? { ...it, [field]: value } : it));
        markItemsDirty(next);
    };

    /** ---------- Submit ---------- */
    const onSubmit: React.FormEventHandler = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Send only changed top-level keys (plus computed price)
            const payload: AnyRec = {};
            dirtyKeys.forEach((k) => {
                payload[k] = draft[k];
            });

            // Keep price in sync (optional)
            payload.price = calculateTotal();

            const res = await fetch(`/api/shipments/${shipmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to update shipment");
            alert("✅ Shipment updated successfully!");
            window.location.href = "/shipments";
        } catch (err) {
            console.error(err);
            alert("❌ Update failed.");
        } finally {
            setIsLoading(false);
        }
    };

    /** ---------- UI helpers ---------- */
    const statusVariant = (s?: string) =>
        s === "Delivered" ? "default" : s === "Delayed" ? "destructive" : "secondary";

    /** ---------- Loading / Not found ---------- */
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
        );
    }

    if (!original) {
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
                            <p className="text-gray-600 mb-4">
                                The shipment you're looking for doesn't exist or has been removed.
                            </p>
                            <Button asChild>
                                <Link href="/shipments">Return to Shipments</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    /** ---------- Keys to display dynamically ---------- */
    const topKeys: string[] = [
        "status",
        "type",
        "transfer_shipment_id",
        "trackingNumber",
        "vendor",
        "customer",
        "vessel",
        "driver",
        "vehicle",
        "port",
        "address",
        "priority",
        "notes",
    ];

    // Show all other editable keys (excluding read-only, topKeys, items, and hidden)
    const dynamicKeys = Object.keys(draft)
        .filter((k) => !READONLY_KEYS.has(k) && !HIDDEN_KEYS.has(k))
        .filter((k) => !topKeys.includes(k) && k !== "items")
        .sort();

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
                                    <Badge variant={statusVariant(draft.status)}>{draft.status}</Badge>
                                </div>
                                <p className="text-gray-600">
                                    Modify shipment {original.id || original.shipmentId || original._id}
                                </p>
                            </div>
                        </div>
                        <UserNav />
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Meta */}
                <Card className="mb-6">
                    <CardContent className="py-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Created</p>
                                <p className="font-medium">
                                    {original.createdAt ? format(new Date(original.createdAt), "PPP") : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Last Updated</p>
                                <p className="font-medium">
                                    {original.updatedAt ? format(new Date(original.updatedAt), "PPP") : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Type</p>
                                <p className="font-medium capitalize">{draft.type}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Current Value</p>
                                <p className="font-medium">S${calculateTotal().toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Key fields */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Edit className="h-5 w-5 mr-2" />
                                Key Fields
                            </CardTitle>
                            <CardDescription>Update the core shipment attributes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Status */}
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={draft.status ?? ""}
                                        onValueChange={(v) => markDirty("status", v)}
                                    >
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

                                {/* Type */}
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={draft.type ?? ""}
                                        onValueChange={(v: "incoming" | "internal") => markDirty("type", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="incoming">Incoming</SelectItem>
                                            <SelectItem value="internal">Internal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Transfer Shipment Id (dedupe key for inventory) */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="transfer_shipment_id">Transfer Shipment ID (optional)</Label>
                                    <Input
                                        id="transfer_shipment_id"
                                        placeholder="e.g. TR-2025-001"
                                        value={draft.transfer_shipment_id ?? ""}
                                        onChange={(e) => markDirty("transfer_shipment_id", e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500">
                                        If set, this ID will be used as the Inventory id when status becomes <b>Delivered</b>.
                                    </p>
                                </div>

                                {/* Common text fields */}
                                {["trackingNumber", "vendor", "customer", "vessel", "driver", "vehicle", "port"].map(
                                    (k) => (
                                        <div className="space-y-2" key={k}>
                                            <Label htmlFor={k}>{k}</Label>
                                            <Input
                                                id={k}
                                                value={draft[k] ?? ""}
                                                onChange={(e) => markDirty(k, e.target.value)}
                                            />
                                        </div>
                                    )
                                )}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">address</Label>
                                    <Textarea
                                        id="address"
                                        value={draft.address ?? ""}
                                        onChange={(e) => markDirty("address", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={draft.notes ?? draft.description ?? ""}
                                        onChange={(e) => markDirty("notes", e.target.value)}
                                    />
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label htmlFor="priority">priority</Label>
                                    <Select
                                        value={draft.priority ?? "Standard"}
                                        onValueChange={(v) => markDirty("priority", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Standard">Standard</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                            <SelectItem value="Urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date-ish fields present on the doc (render as date input) */}
                                {Object.keys(draft)
                                    .filter((k) => isDateKey(k))
                                    .filter((k) => !READONLY_KEYS.has(k))
                                    .map((k) => {
                                        const val = draft[k];
                                        // normalize to yyyy-mm-dd for input value
                                        const isoStr = (() => {
                                            if (!val) return "";
                                            const d = new Date(val);
                                            if (Number.isNaN(d.getTime())) return "";
                                            return d.toISOString().slice(0, 10);
                                        })();
                                        return (
                                            <div className="space-y-2" key={k}>
                                                <Label htmlFor={k}>{k}</Label>
                                                <Input
                                                    id={k}
                                                    type="date"
                                                    value={isoStr}
                                                    onChange={(e) => {
                                                        const v = e.target.value ? new Date(e.target.value).toISOString() : "";
                                                        markDirty(k, v);
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipment Items</CardTitle>
                            <CardDescription>Edit items detected/attached to this shipment</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {items.map((it) => (
                                <div key={it.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                                    <div className="md:col-span-2">
                                        <Label>Item Description</Label>
                                        <Input
                                            value={it.description}
                                            onChange={(e) => updateItem(it.id, "description", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input
                                            type="number"
                                            value={String(it.quantity ?? "")}
                                            onChange={(e) => updateItem(it.id, "quantity", parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Unit</Label>
                                        <Select
                                            value={it.unit}
                                            onValueChange={(v) => updateItem(it.id, "unit", v)}
                                        >
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
                                            value={String(it.unitPrice ?? "")}
                                            onChange={(e) => updateItem(it.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeItem(it.id)}
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
                                        Total Value: S${calculateTotal().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dynamic fields (EVERY OTHER KEY) */}
                    {dynamicKeys.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Other Attributes</CardTitle>
                                <CardDescription>Edit any additional fields returned by the API</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dynamicKeys.map((k) => {
                                    const v = draft[k];

                                    // Primitive editors
                                    if (typeof v === "string" && !isDateKey(k)) {
                                        return (
                                            <div className="space-y-2" key={k}>
                                                <Label htmlFor={k}>{k}</Label>
                                                <Input
                                                    id={k}
                                                    value={v ?? ""}
                                                    onChange={(e) => markDirty(k, e.target.value)}
                                                />
                                            </div>
                                        );
                                    }
                                    if (typeof v === "number") {
                                        return (
                                            <div className="space-y-2" key={k}>
                                                <Label htmlFor={k}>{k}</Label>
                                                <Input
                                                    id={k}
                                                    type="number"
                                                    value={String(v)}
                                                    onChange={(e) => markDirty(k, parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        );
                                    }
                                    if (typeof v === "boolean") {
                                        return (
                                            <div className="space-y-2" key={k}>
                                                <Label htmlFor={k}>{k}</Label>
                                                <Select
                                                    value={String(v)}
                                                    onValueChange={(val) => markDirty(k, val === "true")}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">true</SelectItem>
                                                        <SelectItem value="false">false</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        );
                                    }

                                    // Arrays/Objects as JSON
                                    return (
                                        <div className="space-y-2 md:col-span-2" key={k}>
                                            <Label htmlFor={k}>{k} (JSON)</Label>
                                            <Textarea
                                                id={k}
                                                className="font-mono text-sm"
                                                rows={4}
                                                value={(() => {
                                                    try {
                                                        return JSON.stringify(v ?? null, null, 2);
                                                    } catch {
                                                        return String(v ?? "");
                                                    }
                                                })()}
                                                onChange={(e) => {
                                                    const text = e.target.value;
                                                    try {
                                                        const parsed = JSON.parse(text);
                                                        markDirty(k, parsed);
                                                    } catch {
                                                        // keep raw text if not valid JSON yet
                                                        markDirty(k, text);
                                                    }
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/shipments">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isLoading || dirtyKeys.size === 0}>
                            <Save className="h-4 w-4 mr-2" />
                            {isLoading ? "Updating Shipment..." : dirtyKeys.size === 0 ? "No changes" : "Save changes"}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}
