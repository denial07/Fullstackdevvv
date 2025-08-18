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
        headerOrder?: string[];
        bookType?: BookType;             // 'xlsx' | 'csv' | ...
    }
) {
    const fileName = (opts?.fileName ?? "export") + "." + (opts?.bookType ?? "xlsx");
    const sheetName = opts?.sheetName ?? "Data";

    const flattened = rows.map(r => flattenRecord(r));
    const headers = opts?.headerOrder ?? Array.from(new Set(flattened.flatMap(r => Object.keys(r))));
    const normalized = flattened.map(r =>
        headers.reduce((acc, h) => {
            acc[h] = r[h] ?? "";
            return acc;
        }, {} as Row)
    );

    const ws = utils.json_to_sheet(normalized, { header: headers, skipHeader: false });

    const colWidths = headers.map(h => {
        const maxLen = Math.max(h.length, ...normalized.map(row => String(row[h] ?? "").length));
        return { wch: Math.min(Math.max(maxLen + 2, 8), 60) };
    });
    (ws as any)["!cols"] = colWidths;

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, sheetName);
    writeFile(wb, fileName, { bookType: opts?.bookType ?? "xlsx" });
}

/** Small helper just for the Warehouse sheet with a merged title row. */
export function exportWarehouseSheet(
    data: Array<{ "No.": number; "ETA": any; "Description": any; "Qty (container)": any }>,
    opts?: { fileName?: string; title?: string }
) {
    const title = opts?.title ?? "Incoming Shipments (Containers)";
    const headers = ["No.", "ETA", "Description", "Qty (container)"];

    // Build with AOA to allow merge + custom header placement
    const ws = utils.aoa_to_sheet([[title], headers]);
    // Merge A1:D1
    (ws as any)["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    // Column widths
    (ws as any)["!cols"] = [{ wch: 6 }, { wch: 18 }, { wch: 40 }, { wch: 16 }];

    // Put data starting at A3
    utils.sheet_add_json(ws, data, { origin: "A3", skipHeader: true });

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Incoming Shipments");
    writeFile(wb, `${opts?.fileName ?? "shipments_warehouse"}.xlsx`);
}
