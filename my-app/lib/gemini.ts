// lib/gemini.ts
import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

type ScalarType = "string" | "number" | "integer" | "date" | "boolean";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else if (process.env.NODE_ENV !== "production") {
    console.warn("GEMINI_API_KEY not set — Gemini features disabled.");
}

/** Get a configured Gemini model, or null if disabled. */
export function getGemini(modelName = DEFAULT_MODEL): GenerativeModel | null {
    if (!genAI) return null;
    return genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
        },
    });
}

/** Heuristic local fallback if API unavailable or parsing fails. */
function inferTypeLocally(columnName: string, samples?: any[]): ScalarType {
    const vals = (samples ?? []).filter(v => v != null).slice(0, 25).map(String);
    let num = 0, int = 0, dt = 0, bool = 0, total = vals.length || 1;

    for (const s of vals) {
        const t = s.trim().toLowerCase();
        if (t === "true" || t === "false" || t === "yes" || t === "no") bool++;
        const n = Number(s.replace(/,/g, ""));
        if (!Number.isNaN(n)) {
            num++;
            if (Number.isInteger(n)) int++;
        }
        if (!Number.isNaN(Date.parse(s))) dt++;
    }

    if (bool / total > 0.6) return "boolean";
    if (dt / total > 0.6) return "date";
    if (num / total > 0.6) return int / num > 0.9 ? "integer" : "number";
    return "string";
}

function stripCodeFence(s: string) {
    return s.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}
function clamp01(n: any) {
    const v = Number(n);
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
}
function scrub(s: string) {
    // keep formats, remove PII-ish details
    return String(s ?? "")
        .replace(/[A-Z]/g, "A")
        .replace(/[a-z]/g, "a")
        .replace(/\d/g, "0");
}

/** LLM-assisted data-type guess (uses samples if provided). Falls back locally. */
export async function inferDataTypeWithGemini(
    columnName: string,
    samples?: any[],
    modelName?: string
): Promise<ScalarType> {
    const model = getGemini(modelName);
    if (!model) return inferTypeLocally(columnName, samples);

    const payload = {
        columnName,
        allowedTypes: ["string", "number", "integer", "date", "boolean"],
        samples: (samples ?? []).slice(0, 25).map(v => scrub(v)),
        guidance:
            "Pick exactly one type from allowedTypes. Prefer 'integer' only if all numeric samples are whole numbers.",
    };
    const sys =
        "You are a strict type classifier for spreadsheet columns. Respond ONLY with JSON: {\"type\":\"<one>\"}.";

    try {
        const res = await model.generateContent([{ text: sys }, { text: JSON.stringify(payload) }]);
        let text = stripCodeFence(res.response.text());
        const out = JSON.parse(text);
        if (["string", "number", "integer", "date", "boolean"].includes(out?.type)) {
            return out.type as ScalarType;
        }
    } catch {
        // fall through
    }
    return inferTypeLocally(columnName, samples);
}

/** Canonical schema field for header mapping. */
export type CanonicalField = { name: string; type: ScalarType };

/** Suggestion for mapping an incoming header to a canonical field. */
export type MappingSuggestion = {
    incoming: string;
    mapTo: string | null;
    nameConfidence: number; // 0..1
    typeConfidence: number; // 0..1
    rationale?: string;
};

/**
 * Ask Gemini to map ambiguous headers using header names + scrubbed sample values.
 * Returns an array of suggestions you can merge into your proposals.
 */
export async function suggestHeaderMappingsWithGemini(params: {
    incomingHeaders: string[];
    canonicalFields: CanonicalField[];
    samplesByHeader?: Record<string, string[]>;
    modelName?: string;
}): Promise<MappingSuggestion[]> {
    const model = getGemini(params.modelName);
    if (!model || params.incomingHeaders.length === 0) return [];

    const sys = `Map incoming spreadsheet headers to a canonical schema.
Rules:
- Consider BOTH header wording AND example values (already scrubbed).
- Use types: string|number|integer|date|boolean.
- If unsure, set mapTo=null and confidences <= 0.6.
- Respond ONLY with a JSON array of objects:
  { incoming, mapTo, nameConfidence, typeConfidence, rationale }`;

    const payload = {
        incoming: params.incomingHeaders,
        schema: params.canonicalFields,
        samples: params.samplesByHeader ?? {},
    };

    try {
        const res = await model.generateContent([{ text: sys }, { text: JSON.stringify(payload) }]);
        let text = stripCodeFence(res.response.text());
        const arr = JSON.parse(text) as any[];
        return (Array.isArray(arr) ? arr : [])
            .filter(x => x && typeof x.incoming === "string")
            .map(x => ({
                incoming: x.incoming,
                mapTo: typeof x.mapTo === "string" ? x.mapTo : null,
                nameConfidence: clamp01(x.nameConfidence),
                typeConfidence: clamp01(x.typeConfidence),
                rationale: typeof x.rationale === "string" ? x.rationale.slice(0, 200) : undefined,
            }));
    } catch {
        return [];
    }
}
