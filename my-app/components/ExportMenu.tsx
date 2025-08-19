
"use client";

import * as React from "react";
import type { Table, Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, SlidersHorizontal } from "lucide-react";
import { exportToXlsx, exportWarehouseSheet } from "@/lib/export-excel";

export type Props = {
  table: Table<any>;
  fileNameBase?: string;
  warehouseMap?: { eta?: string; description?: string; qty?: string };
};

const prettyFromId = (id: string) =>
  id.replace(/[_\-.]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

function getCellValue(row: any, col: Column<any, unknown>) {
  try {
    const v = row.getValue(col.id);
    if (v !== undefined) return v;
  } catch {}
  const ak = (col.columnDef as any)?.accessorKey as string | undefined;
  if (ak && row.original) {
    const v = row.original[ak];
    if (v !== undefined) return v;
  }
  const afn = (col.columnDef as any)?.accessorFn as
    | ((orig: any, index?: number) => any)
    | undefined;
  if (typeof afn === "function") {
    try {
      return afn(row.original, row.index);
    } catch {}
  }
  return row.original?.[col.id];
}

export default function ExportMenu({ table, fileNameBase = "export", warehouseMap }: Props) {
  const [open, setOpen] = React.useState(false);

  // columns
  const visibleCols = React.useMemo(
    () => table.getVisibleLeafColumns().filter((c) => !["select", "actions"].includes(c.id)),
    [table]
  );
  const allLeafCols = React.useMemo(
    () => table.getAllLeafColumns().filter((c) => !["select", "actions"].includes(c.id)),
    [table]
  );

  // rows (selected > filtered). We do NOT fall back to core; if you filtered everything, export nothing.
  const selectedRows = table.getSelectedRowModel().rows;
  const filteredRows = table.getFilteredRowModel().rows;
  const srcRows = selectedRows.length ? selectedRows : filteredRows;

  // custom columns dialog
  type UICol = { id: string; label: string; _col: Column<any, unknown> };
  const uiCols: UICol[] = React.useMemo(
    () => (allLeafCols.length ? allLeafCols : visibleCols).map((c) => ({
      id: c.id,
      label:
        typeof c.columnDef.header === "string"
          ? (c.columnDef.header as string)
          : prettyFromId(c.id),
      _col: c,
    })),
    [allLeafCols, visibleCols]
  );
  const [selectedIds, setSelectedIds] = React.useState<string[]>(visibleCols.map((c) => c.id));
  React.useEffect(() => setSelectedIds(visibleCols.map((c) => c.id)), [visibleCols]);

  function toObjects(rows: any[], cols: Column<any, unknown>[]) {
    const headers = cols.map((c) =>
      typeof c.columnDef.header === "string" ? (c.columnDef.header as string) : prettyFromId(c.id)
    );
    const data = rows.map((r) =>
      cols.reduce((acc, c, i) => {
        acc[headers[i]] = getCellValue(r, c);
        return acc;
      }, {} as Record<string, unknown>)
    );
    return { headers, data };
  }

  const ensureRows = () => {
    if (srcRows.length === 0) {
      alert("No rows match the current filters/selection.");
      return false;
    }
    return true;
  };

  const exportFilteredVisible = () => {
    if (!ensureRows()) return;
    const { headers, data } = toObjects(srcRows, visibleCols);
    exportToXlsx(data, {
      fileName: `${fileNameBase}_filtered_visible`,
      sheetName: "Filtered",
      headerOrder: headers,
    });
  };

  const exportFilteredAll = () => {
    if (!ensureRows()) return;
    const cols = allLeafCols.length ? allLeafCols : visibleCols;
    const { headers, data } = toObjects(srcRows, cols);
    exportToXlsx(data, {
      fileName: `${fileNameBase}_filtered_all`,
      sheetName: "Filtered(All)",
      headerOrder: headers,
    });
  };

  const exportCustom = () => {
    if (!ensureRows()) return;
    const byId: Record<string, Column<any, unknown>> = {};
    (allLeafCols.length ? allLeafCols : visibleCols).forEach((c) => (byId[c.id] = c));
    const cols = selectedIds.map((id) => byId[id]).filter(Boolean);
    if (!cols.length) {
      alert("Pick at least one column.");
      return;
    }
    const { headers, data } = toObjects(srcRows, cols);
    exportToXlsx(data, {
      fileName: `${fileNameBase}_custom`,
      sheetName: "Custom",
      headerOrder: headers,
    });
    setOpen(false);
  };

  const exportWarehouse = () => {
    if (!ensureRows()) return;
    const pick = (needles: string[]) =>
      uiCols.find((c) => needles.some((n) => c.id.toLowerCase().includes(n)))?.id;

    const etaId = warehouseMap?.eta ?? pick(["eta", "arrival"]);
    const descId = warehouseMap?.description ?? pick(["description", "desc"]);
    const qtyId = warehouseMap?.qty ?? pick(["qty", "quantity", "container"]);

    const data = srcRows.map((r: any, i: number) => ({
      "No.": i + 1,
      ETA: etaId ? r.getValue(etaId) : "",
      Description: descId ? r.getValue(descId) : "",
      "Qty (container)": qtyId ? r.getValue(qtyId) : "",
    }));

    exportWarehouseSheet(data, { fileName: `${fileNameBase}_warehouse` });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            {selectedRows.length ? "Export (selected rows)" : "Export (filtered rows)"}
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={exportFilteredVisible}>
            Filtered + Visible columns
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportFilteredAll}>
            Filtered + All columns
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportWarehouse}>Export for warehouse staff</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Custom columns…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select columns to export</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2">
            {uiCols.map((c) => {
              const checked = selectedIds.includes(c.id);
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) =>
                      setSelectedIds((prev) =>
                        v === true ? [...prev, c.id] : prev.filter((x) => x !== c.id)
                      )
                    }
                  />
                  <Label className="cursor-pointer">{c.label}</Label>
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


