// /lib/import/type-infer.ts
import { parse } from "date-fns";

const DATE_FORMATS = ["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy"];

function isBoolean(v: any) {
    if (typeof v === "boolean") return true;
    if (typeof v === "string") { const s = v.trim().toLowerCase(); return ["true", "false", "yes", "no", "y", "n", "1", "0"].includes(s); }
    return false;
}
function isInteger(v: any) { const n = Number(String(v).replace(/[, ]/g, "")); return Number.isInteger(n); }
function isNumber(v: any) { const n = Number(String(v).replace(/[, ]/g, "")); return Number.isFinite(n); }
function isDate(v: any) {
    if (v instanceof Date && !isNaN(v.valueOf())) return true;
    if (typeof v === "number") return v > 0 && v < 4102444800000; // naive epoch bound
    if (typeof v === "string") {
        for (const f of DATE_FORMATS) { const d = parse(v, f, new Date()); if (!isNaN(d.valueOf())) return true; }
    }
    return false;
}

export type InferredType = "string" | "integer" | "number" | "date" | "boolean";

export function inferColumnType(samples: any[], minSupport = 0.6): { type: InferredType, support: number } {
    const counts: Record<InferredType, number> = { string: 0, integer: 0, number: 0, date: 0, boolean: 0 };
    let total = 0;
    for (const raw of samples) {
        if (raw === null || raw === undefined || raw === "") continue;
        total++;
        if (isBoolean(raw)) counts.boolean++;
        else if (isInteger(raw)) counts.integer++;
        else if (isNumber(raw)) counts.number++;
        else if (isDate(raw)) counts.date++;
        else counts.string++;
    }
    if (total === 0) return { type: "string", support: 1 }; // default for empty columns
    // pick best
    let best: InferredType = "string", bestC = -1;
    (Object.keys(counts) as InferredType[]).forEach(k => { if (counts[k] > bestC) { best = k; bestC = counts[k]; } });
    return { type: best, support: bestC / total };
}

// numeric family helper: integer is subset of number
export function typeMatchConfidence(inferred: InferredType, canonical: InferredType, support: number) {
    if (inferred === canonical) return Math.max(0.95, support); // strong
    if (inferred === "integer" && canonical === "number") return Math.max(0.85, support * 0.9);
    if (inferred === "number" && canonical === "integer") return Math.max(0.7, support * 0.7);
    return Math.min(0.5, support); // weak
}
