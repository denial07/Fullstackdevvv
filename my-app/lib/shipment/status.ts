// lib/shipment/status.ts
import { classifyShipmentStatusWithGemini } from "@/lib/shipment/status_ai";
type ThreeStatus = "In Transit" | "Delayed" | "Delivered";

function pick(obj: any, keys: string[]) {
    for (const k of keys) {
        const v = obj?.[k];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
}

function toDate(v: any): Date | null {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

export function normalizeStatusText(s?: string | null): ThreeStatus | null {
    if (!s) return null;
    const t = String(s).toLowerCase().trim();
    if (/(delivered|complete|done)/.test(t)) return "Delivered";
    if (/(delay|late|postpon)/.test(t)) return "Delayed";
    if (/(transit|shipping|en route|enroute|in\s*progress|shipped)/.test(t)) return "In Transit";
    return null;
}

/** Fast deterministic rules; return null if not confident. */
export function ruleBasedStatus(row: Record<string, any>, now = new Date()): ThreeStatus | null {
    const statusText = pick(row, ["status"]);
    const normalized = normalizeStatusText(statusText);
    if (normalized) return normalized;

    const eta = toDate(pick(row, ["estimateddelivery", "eta", "arrival", "deliveryeta"]));
    const newEta = toDate(pick(row, ["revisedeta", "neweta", "eta_updated"]));
    const delivered = toDate(pick(row, ["delivereddate", "deliverydate"]));

    if (delivered) return "Delivered";
    if (eta) {
        if (now < eta) return "In Transit";
        // past ETA → likely delayed, unless there is a valid revised ETA in the future
        if ((newEta && newEta > eta) || (!newEta && now > eta)) return "Delayed";
        return "In Transit";
    }
    // No dates and no clear text → uncertain
    return null;
}

/** Decide the 3-status value using rules, then Gemini if needed. */
export async function decideShipmentStatus(row: Record<string, any>): Promise<ThreeStatus> {
    const rule = ruleBasedStatus(row);
    if (rule) return rule;

    // fallback to LLM only if rules didn’t settle it
    const ai = await classifyShipmentStatusWithGemini(row);
    return ai ?? "In Transit";
}
