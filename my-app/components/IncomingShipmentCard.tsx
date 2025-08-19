'use client';

import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import Link from "next/link";

type AnyObj = Record<string, any>;
type ShipStatus = "Delivered" | "In Transit" | "Delayed";

/* ---------- helpers ---------- */
function pickDeep<T = any>(obj: AnyObj, paths: string[], fallback?: T): T | undefined {
    for (const path of paths) {
        const v = path.split(".").reduce<any>((acc, k) => (acc == null ? acc : acc[k]), obj);
        if (v !== undefined && v !== null && v !== "") return v as T;
    }
    return fallback;
}

function parseDateLike(v: any): Date | null {
    if (v === 0 || v === "0" || v === null || v === undefined || v === "") return null;
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return null;
    const year = d.getUTCFullYear();
    // treat epoch/old placeholders as "no date"
    if (d.getTime() === 0 || year < 2000) return null;
    return d;
}

function truthy(v: any): boolean {
    if (typeof v === "string") {
        const t = v.trim().toLowerCase();
        return ["true", "yes", "y", "1", "delivered", "received", "completed"].includes(t);
    }
    return !!v;
}

function normalizeStatus(s?: string): ShipStatus | undefined {
    if (!s) return;
    const t = s.toLowerCase().trim();
    if (/(delivered|completed|received|arrived)/.test(t)) return "Delivered";
    if (/(delayed|late|held|exception)/.test(t)) return "Delayed";
    if (/(in\s*transit|shipped|shipping|out for delivery|processing|dispatch)/.test(t)) return "In Transit";
    return undefined;
}

const currencySGD = new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 2,
});
/* -------------------------------- */

export default function IncomingShipmentCard({ shipment }: { shipment: AnyObj }) {
    // ID
    const displayId =
        pickDeep<string>(shipment, ["shipmentid", "id", "trackingnumber", "orderid", "_id"]) ?? "—";

    // Vendor (string or object)
    const vendorRaw = pickDeep<any>(shipment, [
        "vendor", "supplier",
        "vendor.name", "supplier.name",
        "vendor.companyName", "supplier.companyName",
        "shipper.name", "sender.name"
    ]);
    const vendor =
        typeof vendorRaw === "string"
            ? vendorRaw
            : vendorRaw?.name ?? vendorRaw?.companyName ?? vendorRaw?.label ?? "—";

    // Destination (string or object)
    const dest =
        pickDeep<any>(shipment, ["destination", "address", "city"]) ??
        pickDeep<any>(shipment, [
            "shippingAddress", "shipping.address", "destinationAddress"
        ]);

    const destination =
        typeof dest === "string"
            ? dest
            : [
                pickDeep<string>(dest ?? shipment, ["line1", "shippingAddress.line1"]),
                pickDeep<string>(dest ?? shipment, ["city", "shippingAddress.city"]),
                pickDeep<string>(dest ?? shipment, ["country", "shippingAddress.country"]),
            ].filter(Boolean).join(", ") || "—";

    // Description (prefer text; else summarise items)
    const textDesc = pickDeep<any>(shipment, ["description", "notes", "summary", "remarks"]);
    const items: AnyObj[] | null = Array.isArray(shipment?.items) ? shipment.items : null;

    const description =
        typeof textDesc === "string" && textDesc.trim() !== ""
            ? textDesc
            : items
                ? items
                    .map((it) => {
                        const name = it.description ?? it.name ?? it.sku ?? "Item";
                        const qty =
                            [it.quantity, it.unit].filter(Boolean).join(" ") ||
                            (it.quantity ? String(it.quantity) : "");
                        return qty ? `${name} (${qty})` : name;
                    })
                    .join(", ")
                : "—";

    // Dates
    const eta =
        parseDateLike(
            pickDeep<any>(shipment, [
                "estimateddelivery", "eta", "arrival", "deliveryeta",
                "estimatedDelivery", "expectedDelivery", "estimatedArrival", "expectedArrival",
                "etaDate", "delivery.eta", "dates.eta"
            ])
        ) ?? null;

    const newEta =
        parseDateLike(
            pickDeep<any>(shipment, ["revisedeta", "neweta", "eta_updated", "delivery.revisedEta"])
        ) ?? null;

    const deliveredDate =
        parseDateLike(
            pickDeep<any>(shipment, ["delivereddate", "deliverydate", "receiveddate", "status.deliveredAt"])
        ) ?? null;

    // Value (field or sum of items)
    const declaredValueField = Number(
        pickDeep<any>(shipment, ["declaredvalue", "decalredvalue", "value", "price", "totalvalue"], 0)
    );
    const itemsTotal =
        items?.reduce(
            (sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0),
            0
        ) ?? 0;
    const declaredValue = (isNaN(declaredValueField) ? 0 : declaredValueField) || itemsTotal || 0;

    // Status (respect explicit flags first)
    const statusFromData = normalizeStatus(
        pickDeep<string>(shipment, ["status", "deliverystatus", "shipmentstatus", "state"])
    );
    const deliveredFlag = truthy(
        pickDeep<any>(shipment, ["delivered", "isdelivered", "received", "isreceived", "completed", "iscompleted"])
    );

    const GRACE_MS = 24 * 60 * 60 * 1000; // 24h
    const nowMs = Date.now();

    let computedStatus: ShipStatus;
    if (deliveredFlag || deliveredDate || statusFromData === "Delivered") {
        computedStatus = "Delivered";
    } else if (statusFromData) {
        computedStatus = statusFromData;
    } else if (eta) {
        const lateNow = nowMs > eta.getTime() + GRACE_MS;
        const etaPushed = !!(newEta && newEta > eta);
        computedStatus = lateNow || etaPushed ? "Delayed" : "In Transit";
    } else {
        computedStatus = "In Transit";
    }

    return (
        <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{String(displayId)}</span>
                <Badge
                    variant={
                        computedStatus === "Delayed"
                            ? "destructive"
                            : computedStatus === "In Transit"
                                ? "secondary"
                                : "default"
                    }
                >
                    {computedStatus}
                </Badge>
            </div>

            <p className="text-sm text-gray-600">{vendor}</p>
            <p className="text-xs text-gray-500">{description}</p>

            <p className="text-xs text-gray-500">
                ETA: {eta ? eta.toLocaleDateString() : "—"}
                {newEta ? ` (revised: ${newEta.toLocaleDateString()})` : ""}
            </p>

            <p className="text-xs text-gray-500">{destination}</p>

            <p className="font-medium mt-2">{currencySGD.format(declaredValue)}</p>

            <div className="mt-4 text-right">
                <Link
                    href={`/shipments/${shipment._id}/edit`}
                    className="inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                </Link>
            </div>
        </div>
    );
}
