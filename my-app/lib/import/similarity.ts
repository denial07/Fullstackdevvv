// /lib/import/similarity.ts
// Lightweight Jaro-Winkler (0..1)
export function jaroWinkler(a: string, b: string) {
    a = a.toLowerCase().trim(); b = b.toLowerCase().trim();
    if (!a.length && !b.length) return 1;
    const m = Math.max(a.length, b.length);
    const matchDistance = Math.floor(m / 2) - 1;

    const aMatches = new Array(a.length).fill(false);
    const bMatches = new Array(b.length).fill(false);

    let matches = 0, transpositions = 0;

    for (let i = 0; i < a.length; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, b.length);
        for (let j = start; j < end; j++) {
            if (bMatches[j]) continue;
            if (a[i] !== b[j]) continue;
            aMatches[i] = true; bMatches[j] = true; matches++; break;
        }
    }
    if (matches === 0) return 0;

    let k = 0;
    for (let i = 0; i < a.length; i++) {
        if (!aMatches[i]) continue;
        while (!bMatches[k]) k++;
        if (a[i] !== b[k]) transpositions++;
        k++;
    }
    let jaro = (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;

    // Winkler bonus for prefix
    let prefix = 0; const maxPrefix = 4;
    for (let i = 0; i < Math.min(maxPrefix, a.length, b.length); i++) {
        if (a[i] === b[i]) prefix++; else break;
    }
    return jaro + prefix * 0.1 * (1 - jaro);
}
