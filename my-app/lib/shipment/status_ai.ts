// lib/shipment/status_ai.ts
import { getGemini } from "@/lib/gemini";

type ThreeStatus = "In Transit" | "Delayed" | "Delivered";

// scrub to avoid sending PII, keep formats
function scrub(v: any) {
    return String(v ?? "")
        .replace(/[A-Z]/g, "A")
        .replace(/[a-z]/g, "a")
        .replace(/\d/g, "0")
        .slice(0, 120);
}

function compactRow(row: Record<string, any>) {
    const keep = [
        "status", "notes", "remark", "reason", "comment",
        "eta", "estimateddelivery", "arrival", "deliveryeta",
        "neweta", "revisedeta", "eta_updated",
        "delivereddate", "deliverydate",
        "milestone", "event", "currentlocation"
    ];
    const out: Record<string, any> = {};
    for (const k of keep) if (k in row) out[k] = scrub(row[k]);
    return out;
}

/** Return one of the three statuses, or null if Gemini disabled/unparseable. */
export async function classifyShipmentStatusWithGemini(row: Record<string, any>): Promise<ThreeStatus | null> {
    const model = getGemini(); // uses gemini-1.5-flash by default in your gemini.ts
    if (!model) return null;

    const sys = `You are a strict classifier for shipment status.
Decide ONE of: "In Transit", "Delayed", "Delivered".
Rules:
- If a delivered date exists or text indicates delivery complete, choose "Delivered".
- If shipment is late vs ETA or text indicates late, choose "Delayed".
- Otherwise choose "In Transit".
Return ONLY JSON: {"status":"In Transit"|"Delayed"|"Delivered"}.`;

    const payload = { row: compactRow(row) };

    try {
        const res = await model.generateContent([{ text: sys }, { text: JSON.stringify(payload) }]);
        let txt = res.response.text().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(txt);
        const s = String(parsed?.status || "").trim();
        if (s === "In Transit" || s === "Delayed" || s === "Delivered") return s as ThreeStatus;
    } catch {
        // fall through
    }
    return null;
}
