import { getGemini } from "@/lib/gemini";

export type AIPick = {
    incoming: string;
    mapTo: string | null;
    nameConfidence: number; // 0..1
    typeConfidence: number; // 0..1
    rationale?: string;
};

export async function geminiSuggestMappings(opts: {
    incomingHeaders: string[];
    canonicalFields: { name: string; type: string }[];
    samplesByHeader: Record<string, string[]>;
}) {
    const model = getGemini(); 
    if (!model || opts.incomingHeaders.length === 0) return [] as AIPick[];

    const system = `
You map spreadsheet column headers to a canonical schema.
Rules:
- Consider BOTH header wording and example values.
- Prefer exact or near-exact synonyms.
- Types: string | number | integer | date | boolean.
- If unsure, return mapTo=null with confidences <= 0.6.
- Output ONLY the JSON array described next. No extra text.`;

    const schemaDesc = {
        fields: opts.canonicalFields,
        instructions:
            "Pick the best match for each incoming header. Confidences are 0..1. Use rationale briefly.",
    };

    const payload = {
        incoming: opts.incomingHeaders,
        sampleValues: opts.samplesByHeader, // scrubbed
        schema: schemaDesc,
    };

    const prompt = JSON.stringify(payload);
    const res = await model.generateContent([{ text: system }, { text: prompt }]);
    let text = res.response.text();
    // Be robust to accidental code fences
    text = text.replace(/^```json\s*/i, "").replace(/```$/i, "");
    try {
        const parsed = JSON.parse(text) as AIPick[];
        // sanitize
        return parsed
            .filter((x) => x && typeof x.incoming === "string")
            .map((x) => ({
                incoming: x.incoming,
                mapTo: x.mapTo ?? null,
                nameConfidence: clamp(x.nameConfidence ?? 0, 0, 1),
                typeConfidence: clamp(x.typeConfidence ?? 0, 1, 1), // default 1 if omitted? safer: 0
                rationale: x.rationale?.slice(0, 200),
            }));
    } catch {
        return [] as AIPick[];
    }
}

function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : 0));
}
