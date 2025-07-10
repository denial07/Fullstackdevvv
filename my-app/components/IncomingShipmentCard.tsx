'use client';

import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import Link from "next/link";

export default function IncomingShipmentCard({ shipment }: { shipment: any }) {
    const eta = new Date(shipment.eta);
    const newEta = shipment.newEta ? new Date(shipment.newEta) : null;
    const deliveredDate = shipment.deliveredDate ? new Date(shipment.deliveredDate) : null;
    const now = new Date();

    let computedStatus = "";

    if (deliveredDate) {
        computedStatus = "Delivered";
    } else if (now < eta) {
        computedStatus = "In Transit";
    } else if (newEta && newEta > eta) {
        computedStatus = "Delayed";
    } else if (now > eta && !newEta) {
        computedStatus = "Delayed";
    } else {
        computedStatus = "In Transit";
    }

    return (
        <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{shipment.id}</span>
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
            <p className="text-sm text-gray-600">{shipment.vendor}</p>
            <p className="text-xs text-gray-500">{shipment.description}</p>
            <p className="text-xs text-gray-500">
                ETA: {new Date(shipment.eta).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500">{shipment.destination}</p>

            <p className="font-medium mt-2">S${(shipment.price || 0).toLocaleString()}</p>

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
