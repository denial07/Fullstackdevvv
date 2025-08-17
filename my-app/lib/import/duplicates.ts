// /lib/import/duplicates.ts
// Strategy: block on strong keys if present (e.g., sku); otherwise use weighted similarity on key fields.
// We compute P(duplicate) in [0..1]; then P(not-dup) = 1 - P(dup).
// If P(not-dup) >= 0.90 -> autoInsert; else -> review.

import { jaroWinkler } from "./similarity";

function tok(s: any) { return String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

function fieldSim(a: any, b: any) {
    const sa = tok(a), sb = tok(b);
    if (!sa && !sb) return 1;
    if (!sa || !sb) return 0;
    return jaroWinkler(sa, sb);
}

// Combine similarities across fields into a duplicate probability
function duplicateProbability(a: any, b: any) {
    // tune weights to your domain
    const w = {
        sku: 0.55, brand: 0.15, model: 0.20, price: 0.10
    };
    // if sku exists on both, sku match dominates
    const skuSim = (a.sku && b.sku) ? fieldSim(a.sku, b.sku) : 0;
    const brandSim = fieldSim(a.brand, b.brand);
    const modelSim = fieldSim(a.model, b.model);
    const priceSim = (a.price != null && b.price != null) ? (1 - Math.min(1, Math.abs(Number(a.price) - Number(b.price)) / Math.max(1, Number(a.price)))) : 0.5;

    const score = w.sku * skuSim + w.brand * brandSim + w.model * modelSim + w.price * priceSim;

    // map to probability-ish; bounded & curved
    const prob = Math.max(0, Math.min(1, 1 / (1 + Math.exp(-8 * (score - 0.8))))); // steep near 0.8
    return prob;
}

export function buildDuplicateReport(
    incomingRows: Record<string, any>[],
    sourceHeaders: string[],                   // original headers (pre-normalization)
    existingDocs: Record<string, any>[]
) {
    const autoInsert: any[] = [];
    const review: any[] = [];

    // Normalize each row into a lean object with common fields we care about
    const norm = (r: any) => ({
        raw: r,
        sku: r["sku"] ?? r["SKU"] ?? r[sourceHeaders.find(h => /sku|item\s?code|id/i.test(h)) ?? ""] ?? null,
        brand: r["brand"] ?? r[sourceHeaders.find(h => /brand|maker|manufacturer/i.test(h)) ?? ""] ?? null,
        model: r["model"] ?? r[sourceHeaders.find(h => /model/i.test(h)) ?? ""] ?? null,
        price: r["price"] ?? r[sourceHeaders.find(h => /price|amount/i.test(h)) ?? ""] ?? null,
    });

    const existing = existingDocs.map(norm);
    for (const row of incomingRows) {
        const a = norm(row);
        let bestProb = 0;
        for (const b of existing) {
            const p = duplicateProbability(a, b);
            if (p > bestProb) bestProb = p;
            if (bestProb > 0.99) break;
        }
        const pNotDup = 1 - bestProb;
        if (pNotDup >= 0.90) autoInsert.push({ row: a.raw, confidenceNotDuplicate: pNotDup });
        else review.push({ row: a.raw, probabilityDuplicate: bestProb });
    }
    return { autoInsert, review };
}
