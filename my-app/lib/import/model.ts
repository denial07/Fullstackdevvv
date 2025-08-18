// lib/import/models.ts
import Shipments from "@/lib/models/Shipment"; // <-- matches your plural file

// Return the Mongoose model for a given logical entity name
export function getEntityModel(entity: string) {
    switch ((entity || "").toLowerCase()) {
        case "shipment":
        case "shipments":
            return Shipments;
        default:
            return null as any; // extend as you add more entities
    }
}
