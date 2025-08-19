"use client";

import * as React from "react";
import type { Table, Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, SlidersHorizontal } from "lucide-react";
import { exportToXlsx, exportWarehouseSheet } from "@/lib/export-excel";

/** --------- Types you can pass from your page ---------- */
export type ColumnSpec = {
    key: string; // may contain "a|b|c" meaning "first non-empty of a/b/c"
    label: string;
    width?: string;
};

type WarehouseMap = {
    eta?: string;
    description?: string;
    qty?: string;
};

type Props = {
    /** Option A: export from TanStack table (recommended – gets filtered/paginated/selected rows) */
    table?: Table<any>;

    /** Option B: export from plain state (fallback) */
    rows?: Record<string, unknown>[];
    columnSpecs?: ColumnSpec[];

    fileNameBase?: string;
    warehouseMap?: WarehouseMap;
};

const prettyFromId = (id: string) =>
    id.replace(/[_\-.]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

/** Composite key reader for plain rows */
function valueFromComposite(row: Record<string, unknown>, compositeKey: string) {
    if (!compositeKey.includes("|")) return (row as any)[compositeKey];
    const parts = compositeKey.split("|");
    const val = parts
        .map((k) => (row as any)[k])
        .find((v) => v !== undefined && v !== null && v !== "");
    return val ?? "";
}

/** Safely read a table cell; falls back to original if accessor throws */
function safeGetTableValue(row: any, col: Column<any, unknown>) {
    try {
        return row.getValue(col.id);
    } catch {
        const orig = row.original;
        const key = (col.columnDef as any).accessorKey as string | undefined;
        if (key) return (orig as any)?.[key];
        return (orig as any)?.[col.id];
    }
}

export default function ExportMenu({
    table,
    rows,
    columnSpecs,
    fileNameBase = "export",
    warehouseMap,
}: Props) {
    const [open, setOpen] = React.useState(false);

    // ------------- Column lists (table-aware) -------------
    const visibleCols = React.useMemo(
        () =>
            table
                ? table
                    .getVisibleLeafColumns()
                    .filter((c) => !["select", "actions"].includes(c.id))
                : [],
        [table]
    );

    const allLeafCols = React.useMemo(
        () =>
            table
                ? table
                    .getAllLeafColumns()
                    .filter((c) => !["select", "actions"].includes(c.id))
                : [],
        [table]
    );

    // For the custom dialog: show ALL columns if we have a table; otherwise from props
    type UnifiedCol =
        | { id: string; label: string; _tableCol?: Column<any, unknown> }
        | { id: string; label: string };

    const columnsForUI: UnifiedCol[] = React.useMemo(() => {
        if (table) {
            return allLeafCols.map((c) => ({
                id: c.id,
                label:
                    typeof c.columnDef.header === "string"
                        ? (c.columnDef.header as string)
                        : prettyFromId(c.id),
                _tableCol: c,
            }));
        }
        return (columnSpecs ?? []).map((c) => ({
            id: c.key,
            label: c.label || prettyFromId(c.key),
        }));
    }, [table, allLeafCols, columnSpecs]);

    // Preselect: visible columns if table; otherwise all provided
    const [selectedIds, setSelectedIds] = React.useState<string[]>(
        table ? visibleCols.map((c) => c.id) : (columnsForUI.map((c) => c.id) ?? [])
    );

    React.useEffect(() => {
        setSelectedIds(table ? visibleCols.map((c) => c.id) : columnsForUI.map((c) => c.id));
    }, [table, visibleCols, columnsForUI]);

    // ------------- Row sources (selection > filtered > fallback) -------------
    const selectedRows = table ? table.getSelectedRowModel().rows : [];
    const hasSelection = selectedRows.length > 0;

    const filteredRows = table ? table.getFilteredRowModel().rows : [];
    const pageRows = table ? table.getPaginationRowModel().rows : [];

    const propsRows = rows ?? [];

    // ------------- Helpers to build export payloads -------------
    function toObjectsFromTable(rows: any[], cols: Column<any, unknown>[]) {
        const headers = cols.map((c) =>
            typeof c.columnDef.header === "string" ? (c.columnDef.header as string) : prettyFromId(c.id)
        );

        const data = rows.map((r) =>
            cols.reduce((acc, c, idx) => {
                acc[headers[idx]] = safeGetTableValue(r, c);
                return acc;
            }, {} as Record<string, unknown>)
        );

        return { headers, data };
    }

    function toObjectsFromProps(
        rows: Record<string, unknown>[],
        colIds: { id: string; label: string }[]
    ) {
        const headers = colIds.map((c) => c.label);
        const data = rows.map((r) =>
            colIds.reduce((acc, c, idx) => {
                acc[headers[idx]] = valueFromComposite(r, c.id);
                return acc;
            }, {} as Record<string, unknown>)
        );
        return { headers, data };
    }

    // ------------- Export actions -------------
    const exportFilteredVisible = () => {
        if (table) {
            const cols = visibleCols;
            const srcRows = hasSelection ? selectedRows : filteredRows;
            const { headers, data } = toObjectsFromTable(srcRows, cols);
            exportToXlsx(data, {
                fileName: `${fileNameBase}_filtered_visible`,
                sheetName: "Filtered",
                headerOrder: headers,
            });
            return;
        }
        // Fallback (no table): export all provided
        const colIds = (columnSpecs ?? []).map((c) => ({ id: c.key, label: c.label || prettyFromId(c.key) }));
        const { headers, data } = toObjectsFromProps(propsRows, colIds);
        exportToXlsx(data, {
            fileName: `${fileNameBase}_all`,
            sheetName: "All",
            headerOrder: headers,
        });
    };

    const exportFilteredAllCols = () => {
        if (table) {
            const cols = allLeafCols;
            const srcRows = hasSelection ? selectedRows : filteredRows;
            const { headers, data } = toObjectsFromTable(srcRows, cols);
            exportToXlsx(data, {
                fileName: `${fileNameBase}_filtered_all`,
                sheetName: "Filtered(All Cols)",
                headerOrder: headers,
            });
            return;
        }
        // Fallback: same as above, no hidden/visible concept
        const colIds = (columnSpecs ?? []).map((c) => ({ id: c.key, label: c.label || prettyFromId(c.key) }));
        const { headers, data } = toObjectsFromProps(propsRows, colIds);
        exportToXlsx(data, {
            fileName: `${fileNameBase}_all`,
            sheetName: "All",
            headerOrder: headers,
        });
    };

    const exportCurrentPageVisible = () => {
        if (!table) return;
        const cols = visibleCols;
        const srcRows = hasSelection ? selectedRows : pageRows;
        const { headers, data } = toObjectsFromTable(srcRows, cols);
        exportToXlsx(data, {
            fileName: `${fileNameBase}_page_visible`,
            sheetName: "Page",
            headerOrder: headers,
        });
    };

    const pick = (needles: string[]) =>
        columnsForUI.find((c) => needles.some((n) => c.id.toLowerCase().includes(n)))?.id;

    const exportWarehouse = () => {
        const etaId = warehouseMap?.eta ?? pick(["eta", "arrival"]);
        const descId = warehouseMap?.description ?? pick(["description", "desc"]);
        const qtyId = warehouseMap?.qty ?? pick(["qty", "quantity", "container"]);

        if (table) {
            const srcRows = hasSelection ? selectedRows : filteredRows;
            const data = srcRows.map((r: any, i: number) => ({
                "No.": i + 1,
                ETA: etaId ? r.getValue(etaId) : "",
                Description: descId ? r.getValue(descId) : "",
                "Qty (container)": qtyId ? r.getValue(qtyId) : "",
            }));
            exportWarehouseSheet(data, { fileName: `${fileNameBase}_warehouse` });
            return;
        }

        // Fallback (props)
        const data = (rows ?? []).map((r, i) => ({
            "No.": i + 1,
            ETA: etaId ? valueFromComposite(r, etaId) : "",
            Description: descId ? valueFromComposite(r, descId) : "",
            "Qty (container)": qtyId ? valueFromComposite(r, qtyId) : "",
        }));
        exportWarehouseSheet(data, { fileName: `${fileNameBase}_warehouse` });
    };

    const exportCustom = () => {
        // Build chosen columns (table-aware if possible)
        if (table) {
            const byId: Record<string, Column<any, unknown>> = {};
            allLeafCols.forEach((c) => (byId[c.id] = c));

            const cols = selectedIds
                .map((id) => byId[id])
                .filter(Boolean);

            const srcRows = hasSelection ? selectedRows : filteredRows;
            const { headers, data } = toObjectsFromTable(srcRows, cols);
            exportToXlsx(data, {
                fileName: `${fileNameBase}_custom`,
                sheetName: "Custom",
                headerOrder: headers,
            });
            setOpen(false);
            return;
        }

        // Fallback (props)
        const chosen = columnsForUI.filter((c) => selectedIds.includes(c.id));
        const { headers, data } = toObjectsFromProps(propsRows, chosen);
        exportToXlsx(data, {
            fileName: `${fileNameBase}_custom`,
            sheetName: "Custom",
            headerOrder: headers,
        });
        setOpen(false);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                        {hasSelection ? "Export (selected rows)" : "Export (filtered rows)"}
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={exportFilteredVisible}>
                        Filtered + Visible columns
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportFilteredAllCols}>
                        Filtered + All columns
                    </DropdownMenuItem>
                    {table && (
                        <>
                            <DropdownMenuItem onClick={exportCurrentPageVisible}>
                                Current page + Visible columns
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={exportWarehouse}>
                        Export for warehouse staff
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setOpen(true)}>
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Custom columns…
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Custom columns dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select columns to export</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-3 py-2">
                        {columnsForUI.map((col) => {
                            const checked = selectedIds.includes(col.id);
                            return (
                                <div key={col.id} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={(v) =>
                                            setSelectedIds((prev) =>
                                                v === true ? [...prev, col.id] : prev.filter((x) => x !== col.id)
                                            )
                                        }
                                    />
                                    <Label className="cursor-pointer">{col.label}</Label>
                                </div>
                            );
                        })}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={exportCustom}>Export selected</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
