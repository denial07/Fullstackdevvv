'use client';

import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Edit } from "lucide-react";

export default function OutgoingShipmentCard({ shipment }: { shipment: any }) {
    const shippingDate = new Date(shipment.shippingDate);
    const label =
        shipment.status === "Delivered"
            ? "Delivered:"
            : shipment.status === "Preparing"
                ? "Scheduled:"
                : "ETA:";

    return (
        <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{shipment.id}</span>
                <Badge
                    variant={
                        shipment.status === "Preparing"
                            ? "outline"
                            : shipment.status === "Delivered"
                                ? "default"
                                : "secondary"
                    }
                >
                    {shipment.status}
                </Badge>
            </div>
            <p className="text-sm text-gray-600">{shipment.customer}</p>
            <p className="text-xs text-gray-500">{shipment.description}</p>
            <p className="text-xs text-gray-500">
                {label} {shippingDate.toLocaleDateString()}
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
