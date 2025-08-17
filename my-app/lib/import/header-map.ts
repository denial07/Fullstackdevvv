// /lib/import/header-map.ts
import { jaroWinkler } from "./similarity";
import { inferColumnType, typeMatchConfidence, InferredType } from "./type-infer";

// Build mappings against an existing schema profile
export type FieldDef = { name: string; type: InferredType; aliases: string[] };

export function proposeHeaderMapping(
    incomingHeaders: string[],
    sampleRows: Record<string, any>[],
    canonicalFields: FieldDef[],
) {
    const samplesByHeader: Record<string, any[]> = {};
    incomingHeaders.forEach(h => samplesByHeader[h] = sampleRows.map(r => r[h]));

    const proposals = incomingHeaders.map(h => {
        // name similarity vs (field.name + aliases)
        let best: null | { field: FieldDef; nameSim: number } = null;
        for (const f of canonicalFields) {
            const candidates = [f.name, ...f.aliases];
            const score = Math.max(...candidates.map(c => jaroWinkler(h, c)));
            if (!best || score > best.nameSim) best = { field: f, nameSim: score };
        }
        // type confidence on samples
        const { type: inferred, support } = inferColumnType(samplesByHeader[h].slice(0, 50));
        const typeConf = best ? typeMatchConfidence(inferred, best.field.type, support) : 0;

        const confident = (best?.nameSim ?? 0) >= 0.95 && typeConf >= 0.95;

        return {
            incoming: h,
            inferredType: inferred,
            inferredSupport: support,          // 0..1
            bestMatch: best?.field?.name ?? null,
            bestMatchType: best?.field?.type ?? null,
            nameConfidence: best?.nameSim ?? 0,
            typeConfidence: typeConf,
            autoMapped: confident,
            needsUserDecision: !confident,
        };
    });

    // New/unknown columns: if no schema yet, we’ll learn them upstream (cold start)
    return proposals;
}
