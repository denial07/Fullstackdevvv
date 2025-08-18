"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
    key: string;    // may contain "a|b|c" meaning "first non-empty of a/b/c"
    label: string;
    width?: string;
};

type WarehouseMap = {
    eta?: string;
    description?: string;
    qty?: string;
};

type Props = {
    /** Option A (recommended for your page): export from state */
    rows?: Record<string, unknown>[];
    columnSpecs?: ColumnSpec[];

    /** Option B: export from TanStack table (filtered rows etc.) */
    table?: Table<any>;

    fileNameBase?: string;
    warehouseMap?: WarehouseMap;
};

/** Utility: pretty label from an id */
const prettyFromId = (id: string) =>
    id.replace(/[_\-.]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

/** Utility: get value for "a|b|c" composite key from a plain row object */
function valueFromComposite(row: Record<string, unknown>, compositeKey: string) {
    if (!compositeKey.includes("|")) return (row as any)[compositeKey];
    const parts = compositeKey.split("|");
    const val = parts
        .map((k) => (row as any)[k])
        .find((v) => v !== undefined && v !== null && v !== "");
    return val ?? "";
}

export default function ExportMenu({
    rows,
    columnSpecs,
    table,
    fileNameBase = "export",
    warehouseMap,
}: Props) {
    const [open, setOpen] = React.useState(false);

    /** ---- Build a unified column list the menu can show ---- */
    type UnifiedCol =
        | { id: string; label: string; kind: "props" }
        | { id: string; label: string; kind: "table" };

    const columnsForUI: UnifiedCol[] = React.useMemo(() => {
        if (table) {
            const leaf = table.getAllLeafColumns().filter((c) => !["select", "actions"].includes(c.id));
            return leaf.map((c) => ({
                id: c.id,
                label: typeof c.columnDef.header === "string" ? (c.columnDef.header as string) : prettyFromId(c.id),
                kind: "table" as const,
            }));
        }
        // fallback to page state
        return (columnSpecs ?? []).map((c) => ({
            id: c.key,
            label: c.label || prettyFromId(c.key),
            kind: "props" as const,
        }));
    }, [table, columnSpecs]);

    const [selectedIds, setSelectedIds] = React.useState<string[]>(
        columnsForUI.map((c) => c.id)
    );

    React.useEffect(() => {
        setSelectedIds(columnsForUI.map((c) => c.id));
    }, [columnsForUI]);

    /** ---- Get the rows to export ---- */
    const exportRowsFromTable = React.useMemo(
        () => (table ? table.getFilteredRowModel().rows : []),
        [table]
    );
    const exportRowsFromProps = rows ?? [];

    /** ---- Helpers to read a value for a given column id ---- */
    function getValueFromTableRow(row: any, colId: string) {
        // TanStack row.getValue() uses the column id (works for accessorKey/accessorFn)
        return row.getValue(colId);
    }

    function getValueFromPlainRow(row: Record<string, unknown>, colId: string) {
        return valueFromComposite(row, colId);
    }

    /** ---- Export All ---- */
    const exportAll = () => {
        const chosen = columnsForUI;
        const headerOrder = chosen.map((c) => c.label);

        const data =
            table
                ? exportRowsFromTable.map((r: any) =>
                    chosen.reduce((acc, c) => {
                        acc[c.label] = getValueFromTableRow(r, c.id);
                        return acc;
                    }, {} as Record<string, unknown>)
                )
                : exportRowsFromProps.map((r) =>
                    chosen.reduce((acc, c) => {
                        acc[c.label] = getValueFromPlainRow(r, c.id);
                        return acc;
                    }, {} as Record<string, unknown>)
                );

        exportToXlsx(data, {
            fileName: `${fileNameBase}_all`,
            sheetName: "All",
            headerOrder,
        });
    };

    /** ---- Export Warehouse ---- */
    const pick = (needles: string[]) =>
        columnsForUI.find((c) => needles.some((n) => c.id.toLowerCase().includes(n)))?.id;

    const exportWarehouse = () => {
        const etaId = warehouseMap?.eta ?? pick(["eta", "arrival"]);
        const descId = warehouseMap?.description ?? pick(["description", "desc"]);
        const qtyId = warehouseMap?.qty ?? pick(["qty", "quantity", "container"]);

        const rowsData = table ? exportRowsFromTable : exportRowsFromProps;

        const data = rowsData.map((r: any, i: number) => ({
            "No.": i + 1,
            ETA: etaId ? (table ? getValueFromTableRow(r, etaId) : getValueFromPlainRow(r, etaId)) : "",
            Description: descId ? (table ? getValueFromTableRow(r, descId) : getValueFromPlainRow(r, descId)) : "",
            "Qty (container)": qtyId ? (table ? getValueFromTableRow(r, qtyId) : getValueFromPlainRow(r, qtyId)) : "",
        }));

        exportWarehouseSheet(data, { fileName: `${fileNameBase}_warehouse` });
    };

    /** ---- Export Custom ---- */
    const exportCustom = () => {
        const chosen = columnsForUI.filter((c) => selectedIds.includes(c.id));
        const headerOrder = chosen.map((c) => c.label);

        const data =
            table
                ? exportRowsFromTable.map((r: any) =>
                    chosen.reduce((acc, c) => {
                        acc[c.label] = getValueFromTableRow(r, c.id);
                        return acc;
                    }, {} as Record<string, unknown>)
                )
                : exportRowsFromProps.map((r) =>
                    chosen.reduce((acc, c) => {
                        acc[c.label] = getValueFromPlainRow(r, c.id);
                        return acc;
                    }, {} as Record<string, unknown>)
                );

        exportToXlsx(data, {
            fileName: `${fileNameBase}_custom`,
            sheetName: "Custom",
            headerOrder,
        });
        setOpen(false);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={exportAll}>Export all columns</DropdownMenuItem>
                    <DropdownMenuItem onClick={exportWarehouse}>Export for warehouse staff</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setOpen(true)}>
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Custom columns…
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
