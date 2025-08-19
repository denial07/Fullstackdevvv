'use client';

import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import Link from "next/link";

type AnyObj = Record<string, any>;

function pick<T = any>(obj: AnyObj, keys: string[], fallback?: T): T | undefined {
    for (const k of keys) {
        const v = obj?.[k];
        if (v !== undefined && v !== null && v !== "") return v as T;
    }
    return fallback;
}

function parseDateLike(v: any): Date | null {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

const currencySGD = new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 2,
});

export default function InternalShipmentCard({ shipment }: { shipment: AnyObj }) {
    // IDs / labels (support both old and new keys)
    const displayId =
        pick<string>(shipment, ["shipmentid", "id", "trackingnumber", "orderid"]) ??
        shipment?._id ??
        "—";

    // Normalise vendor (could be object)
    const vendorRaw = pick<any>(shipment, ["vendor", "supplier"]);
    const vendor =
        typeof vendorRaw === "string"
            ? vendorRaw
            : vendorRaw?.name ?? vendorRaw?.label ?? "—";

    // Normalise destination (string or object)
    const destRaw = pick<any>(shipment, ["destination", "address", "city"]);
    const destination =
        typeof destRaw === "string"
            ? destRaw
            : [destRaw?.line1, destRaw?.city, destRaw?.country]
                .filter(Boolean)
                .join(", ") || "—";

    // Prefer text description; else summarise items array
    const textDesc = pick<any>(shipment, ["description", "notes"]);
    const items: AnyObj[] | null = Array.isArray(shipment?.items)
        ? shipment.items
        : null;

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
            pick<any>(shipment, ["estimateddelivery", "eta", "arrival", "deliveryeta"])
        ) ?? null;

    const newEta =
        parseDateLike(pick<any>(shipment, ["revisedeta", "neweta", "eta_updated"])) ??
        null;

    const deliveredDate =
        parseDateLike(pick<any>(shipment, ["delivereddate", "deliverydate"])) ?? null;

    // Value (fallback to sum of items if field missing)
    const declaredValueField = Number(
        pick<any>(shipment, ["declaredvalue", "decalredvalue", "value", "price", "totalvalue"], 0)
    );
    const itemsTotal =
        items?.reduce(
            (sum, it) =>
                sum +
                (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0),
            0
        ) ?? 0;
    const declaredValue =
        (isNaN(declaredValueField) ? 0 : declaredValueField) || itemsTotal || 0;

    // Status
    const now = new Date();
    let computedStatus = "In Transit";
    if (deliveredDate) {
        computedStatus = "Delivered";
    } else if (eta && now < eta) {
        computedStatus = "In Transit";
    } else if ((newEta && eta && newEta > eta) || (eta && now > eta && !newEta)) {
        computedStatus = "Delayed";
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
