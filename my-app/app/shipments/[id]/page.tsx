// app/shipments/[id]/page.tsx
import { connectToDatabase } from "@/lib/mongodb";
import Shipment from "@/lib/models/Shipment";
import { notFound } from "next/navigation";
import {
    ArrowLeft, Package, Truck, Clock, CheckCircle, MapPin,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type Props = {
    params: { id: string };
};

export default async function ShipmentDetailsPage({ params }: Props) {
    await connectToDatabase();
    const shipment = await Shipment.findOne({ id: params.id }).lean();

    if (!shipment) return notFound();

    const {
        id,
        status,
        eta,
        vendor,
        description,
        origin = "Unknown",
        destination = "Warehouse A",
        shippingDate,
        arrival,
        weight = "N/A",
        recipient = "N/A",
        price,
        refNumber = "N/A",
        serviceType = "Standard",
        trackingUpdates = [],
    } = shipment;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            {/* Header */}
            <div className="mb-6">
                <Link href="/shipments" className="text-blue-600 hover:underline flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Shipments
                </Link>
                <h1 className="text-3xl font-bold mt-4">Shipment Details</h1>
                <p className="text-sm text-gray-500">Track your shipment's progress and view detailed information.</p>
            </div>

            {/* Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8 space-y-2 border">
                <h2 className="text-lg font-semibold">Shipment Overview</h2>
                <p><strong>Tracking Number:</strong> {id}</p>
                <p><strong>Status:</strong> {status}</p>
                <p><strong>Expected Delivery:</strong> {eta ? format(new Date(eta), "PPP") : "TBD"}</p>
            </div>

            {/* Shipment Progress */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8 space-y-6 border">
                <h2 className="text-lg font-semibold">Shipment Progress</h2>
                <ul className="space-y-4">
                    {trackingUpdates?.length > 0 ? (
                        trackingUpdates.map((update: any, idx: number) => (
                            <li key={idx} className="flex items-start gap-3">
                                {renderStatusIcon(update.status)}
                                <div>
                                    <p className="font-medium">{update.status}</p>
                                    <p className="text-sm text-gray-500">{format(new Date(update.date), "PPP, p")}</p>
                                    <p className="text-sm text-gray-600">{update.details}</p>
                                </div>
                            </li>
                        ))
                    ) : (
                        <p>No tracking updates available.</p>
                    )}
                </ul>
            </div>

            {/* Shipment Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border">
                <h2 className="text-lg font-semibold mb-4">Shipment Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <p><strong>Origin:</strong> {origin}</p>
                    <p><strong>Destination:</strong> {destination}</p>
                    <p><strong>Items:</strong> {description}</p>
                    <p><strong>Recipient:</strong> {recipient}</p>
                    <p><strong>Weight:</strong> {weight}</p>
                    <p><strong>Service Type:</strong> {serviceType}</p>
                    <p><strong>Ship Date:</strong> {format(new Date(shippingDate), "PPP")}</p>
                    <p><strong>Reference Number:</strong> {refNumber}</p>
                    <p><strong>Price:</strong> S${price?.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

function renderStatusIcon(status: string) {
    switch (status) {
        case "Shipment Created":
            return <Clock className="text-gray-500 mt-1" />;
        case "Package Picked Up":
            return <Package className="text-blue-500 mt-1" />;
        case "In Transit":
            return <Truck className="text-yellow-500 mt-1" />;
        case "Delivered":
            return <CheckCircle className="text-green-600 mt-1" />;
        default:
            return <MapPin className="text-gray-400 mt-1" />;
    }
}
