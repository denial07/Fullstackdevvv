// lib/export-excel.ts
import { utils, writeFile, BookType } from "xlsx";

type Row = Record<string, unknown>;

function flattenRecord(obj: any, prefix = ""): Row {
    const out: Row = {};
    for (const [k, v] of Object.entries(obj ?? {})) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
            Object.assign(out, flattenRecord(v, key));
        } else if (Array.isArray(v)) {
            out[key] = v.map(x => (typeof x === "object" ? JSON.stringify(x) : x)).join(", ");
        } else {
            out[key] = v as any;
        }
    }
    return out;
}

export function exportToXlsx<T extends Row>(
    rows: T[],
    opts?: {
        fileName?: string;
        sheetName?: string;
        headerOrder?: string[];          // optional explicit column order
        bookType?: BookType;             // default 'xlsx'
    }
) {
    const fileName = (opts?.fileName ?? "export") + "." + (opts?.bookType ?? "xlsx");
    const sheetName = opts?.sheetName ?? "Data";

    // Flatten & gather headers
    const flattened = rows.map(r => flattenRecord(r));
    const headers =
        opts?.headerOrder ??
        Array.from(new Set(flattened.flatMap(r => Object.keys(r))));

    // Re-map rows to consistent header order
    const normalized = flattened.map(r =>
        headers.reduce((acc, h) => {
            acc[h] = r[h] ?? "";
            return acc;
        }, {} as Row)
    );

    // Build worksheet
    const ws = utils.json_to_sheet(normalized, { header: headers, skipHeader: false });

    // Auto-size columns (basic)
    const colWidths = headers.map(h => {
        const maxLen = Math.max(
            h.length,
            ...normalized.map(row => String(row[h] ?? "").length)
        );
        return { wch: Math.min(Math.max(maxLen + 2, 8), 60) }; // clamp width
    });
    (ws as any)["!cols"] = colWidths;

    // Workbook -> file download
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, sheetName);
    writeFile(wb, fileName, { bookType: opts?.bookType ?? "xlsx" });
}
