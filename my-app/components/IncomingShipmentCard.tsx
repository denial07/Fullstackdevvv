// 'use client';

// import { Badge } from "@/components/ui/badge";
// import { Edit } from "lucide-react";
// import Link from "next/link";

// export default function IncomingShipmentCard({ shipment }: { shipment: any }) {
//     const eta = new Date(shipment.eta);
//     const newEta = shipment.newEta ? new Date(shipment.newEta) : null;
//     const deliveredDate = shipment.deliveredDate ? new Date(shipment.deliveredDate) : null;
//     const now = new Date();

//     let computedStatus = "";

//     if (deliveredDate) {
//         computedStatus = "Delivered";
//     } else if (now < eta) {
//         computedStatus = "In Transit";
//     } else if (newEta && newEta > eta) {
//         computedStatus = "Delayed";
//     } else if (now > eta && !newEta) {
//         computedStatus = "Delayed";
//     } else {
//         computedStatus = "In Transit";
//     }

//     return (
//         <div className="p-4 border rounded-lg">
//             <div className="flex items-center justify-between mb-2">
//                 <span className="font-medium">{shipment.id}</span>
//                 <Badge
//                     variant={
//                         computedStatus === "Delayed"
//                             ? "destructive"
//                             : computedStatus === "In Transit"
//                                 ? "secondary"
//                                 : "default"
//                     }
//                 >
//                     {computedStatus}
//                 </Badge>
//             </div>
//             <p className="text-sm text-gray-600">{shipment.vendor}</p>
//             <p className="text-xs text-gray-500">{shipment.description}</p>
//             <p className="text-xs text-gray-500">
//                 ETA: {new Date(shipment.eta).toLocaleDateString()}
//             </p>
//             <p className="text-xs text-gray-500">{shipment.destination}</p>

//             <p className="font-medium mt-2">S${(shipment.decalredvalue || 0).toLocaleString()}</p>

//             <div className="mt-4 text-right">
//                 <Link
//                     href={`/shipments/${shipment._id}/edit`}
//                     className="inline-flex items-center text-sm text-blue-600 hover:underline"
//                 >
//                     <Edit className="w-4 h-4 mr-1" />
//                     Edit
//                 </Link>
//             </div>
//         </div>
//     );
// }

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

export default function IncomingShipmentCard({ shipment }: { shipment: AnyObj }) {
    // IDs / labels (support both old and new keys)
    const displayId =
        pick<string>(shipment, ["shipmentid", "id", "trackingnumber", "orderid"]) ??
        shipment?._id ??
        "—";

    const vendor = pick<string>(shipment, ["vendor", "supplier"]) ?? "—";
    const destination =
        pick<string>(shipment, ["destination", "address", "city"]) ?? "—";
    const description =
        pick<string>(shipment, ["description", "items", "notes"]) ?? "—";

    // Dates (support older 'arrival' and newer 'estimateddelivery', revised/new ETA, delivered date)
    const eta =
        parseDateLike(
            pick<any>(shipment, ["estimateddelivery", "eta", "arrival", "deliveryeta"])
        ) ?? null;

    const newEta =
        parseDateLike(pick<any>(shipment, ["revisedeta", "neweta", "eta_updated"])) ??
        null;

    const deliveredDate =
        parseDateLike(pick<any>(shipment, ["delivereddate", "deliverydate"])) ?? null;

    // Value (fix old typo 'decalredvalue', support multiple names)
    const declaredValue =
        Number(
            pick<any>(shipment, ["declaredvalue", "decalredvalue", "value", "price", "totalvalue"], 0)
        ) || 0;

    // Status logic (unchanged, but works with the normalized dates)
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

            <p className="font-medium mt-2">
                {currencySGD.format(declaredValue)}
            </p>

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
