// Replace letters with 'a', digits with '0', keep punctuation so formats survive.
export function scrubValue(v: unknown): string {
    const s = String(v ?? "");
    return s.replace(/[A-Z]/g, "A").replace(/[a-z]/g, "a").replace(/\d/g, "0");
}

export function buildScrubbedSamples(
    rows: Record<string, any>[],
    headers: string[],
    maxRows = 20
) {
    const out: Record<string, string[]> = {};
    for (const h of headers) out[h] = [];
    for (let i = 0; i < Math.min(rows.length, maxRows); i++) {
        const r = rows[i];
        for (const h of headers) out[h].push(scrubValue(r[h]));
    }
    return out; // { header: ["aaa@aaa.com", "000-000-0000", ...] }
}
