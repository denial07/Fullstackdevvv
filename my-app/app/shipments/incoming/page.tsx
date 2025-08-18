// app/(your-folder)/incoming/page.tsx
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Search, Filter, Download, Ship, Clock, AlertTriangle,
} from "lucide-react";
import { UserNav } from "@/components/user-nav";

import ExportMenu from "@/components/ExportMenu";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
} from "@tanstack/react-table";

/** -------- helpers/types -------- */

const getStatusColor = (status: string) => {
  switch (status) {
    case "Arrived": return "default";
    case "In Transit":
    case "Customs Clearance": return "secondary";
    case "Delayed": return "destructive";
    case "Processing": return "outline";
    default: return "secondary";
  }
};

// Fully dynamic row type (derived at runtime from your fetched data)
type Row = Record<string, unknown>;

// Your column model used for rendering + editing + export mapping
type ColumnSpec = {
  key: string;      // may be "a|b|c" (composite)
  label: string;
  width?: string;
};

// You referenced this in your add-column logic — keeping it here
function getDefaultValueFromType(t: string) {
  switch (t) {
    case "number": return 0;
    case "boolean": return false;
    case "date": return new Date().toISOString().slice(0, 10);
    case "string":
    default: return "";
  }
}

/** -------- page component -------- */

export default function IncomingShipmentsPage() {
  // dynamic data & columns
  const [shipments, setShipments] = useState<Row[]>([]);
  const [columns, setColumns] = useState<ColumnSpec[]>([]);

  // ui states
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; key: string } | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editingColumnLabel, setEditingColumnLabel] = useState<string>("");
  const [newColumn, setNewColumn] = useState("");
  const [newColumnType, setNewColumnType] = useState("string");

  // fetch + infer columns, then (optionally) normalize labels via your API
  useEffect(() => {
    const loadShipments = async () => {
      const res = await fetch("/api/shipments");
      const data: Row[] = await res.json();
      if (!data.length) return;

      const allKeys = Array.from(new Set(data.flatMap(Object.keys)));

      // optional server-side alias map (label -> raw key(s))
      const aliasRes = await fetch("/api/normalize-columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns: allKeys }),
      });

      // expected shape: { "ETA": "eta", "Description": ["desc","description"], ... }
      const aliasMap = (await aliasRes.json()) as Record<string, string | string[]>;

      const inferredColumns: ColumnSpec[] = Object.entries(aliasMap).map(([label, raw]) => ({
        key: Array.isArray(raw) ? raw.join("|") : raw, // composite key to support merging values
        label,
        width: "min-w-[200px]",
      }));

      setColumns(inferredColumns);
      setShipments(data);
    };

    loadShipments();
  }, []);

  /** ----- column defs for TanStack (built from your ColumnSpec) ----- */
  const columnDefs = React.useMemo<ColumnDef<Row>[]>(() => {
    const defs: ColumnDef<Row>[] = columns.map((c) => ({
      id: c.key,
      header: c.label || c.key,
      accessorFn: (row) => {
        // support composite "a|b|c": pick first non-empty
        if (c.key.includes("|")) {
          const parts = c.key.split("|");
          const val = parts
            .map((k) => (row as any)[k])
            .find((v) => v !== undefined && v !== null && v !== "");
          return val ?? "";
        }
        return (row as any)[c.key];
      },
    }));
    return defs;
  }, [columns]);

  /** ----- TanStack table instance (used by ExportMenu) ----- */
  const tableInstance = useReactTable<Row>({
    data: shipments,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /** ----- column header edit helpers ----- */
  const handleEditColumn = (col: { key: string; label: string }) => {
    setEditingColumn(col.key);
    setEditingColumnLabel(col.label);
  };

  const handleSaveColumnLabel = async (oldKey: string) => {
    const newKey = editingColumnLabel.trim();
    if (!newKey || newKey === oldKey) {
      setEditingColumn(null);
      return;
    }

    try {
      const res = await fetch("/api/shipments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldKey, newKey }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert("❌ Failed to rename column: " + (errorData.error || "Unknown error"));
        throw new Error("Rename failed");
      }

      setColumns((prev) =>
        prev.map((col) => (col.key === oldKey ? { ...col, key: newKey, label: newKey } : col))
      );
    } catch (err) {
      console.error("Rename error:", err);
      alert("Failed to rename column.");
    } finally {
      setEditingColumn(null);
    }
  };

  function getRowKey(row: Row, index: number): string {
    const cand =
      (row as any)._id ??
      (row as any).id ??
      (row as any).trackingNumber ??
      (row as any).uuid;
    return cand != null ? String(cand) : `row-${index}`;
  }

  const handleDeleteColumn = async (key: string) => {
    const ok = window.confirm(`Are you sure you want to delete column "${key}" from all shipments?`);
    if (!ok) return;

    try {
      const res = await fetch("/api/shipments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnKey: key }),
      });
      if (!res.ok) throw new Error("Failed to delete column");
      setColumns((prev) => prev.filter((c) => c.key !== key));
    } catch (err) {
      console.error("Delete column error:", err);
      alert("Failed to delete column.");
    }
  };

  const handleAddColumn = async () => {
    if (!newColumn.trim()) return;
    const newColKey = newColumn.trim().toLowerCase().replace(/\s+/g, "_");

    const newCol: ColumnSpec = {
      key: newColKey,
      label: newColumn.trim(),
      width: "w-32",
    };

    // optimistic UI
    setColumns((prev) => [...prev, newCol]);
    setNewColumn("");

    try {
      const res = await fetch("/api/shipments/add-column", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnKey: newColKey,
          columnType: newColumnType,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to add column");

      const defaultValue = getDefaultValueFromType(newColumnType);

      setShipments((prev) =>
        prev.map((s) => ({
          ...s,
          [newColKey]: s[newColKey] ?? defaultValue,
        }))
      );
    } catch (err) {
      console.error("❌ Error adding column:", err);
      alert("Error adding column: " + (err as Error).message);
    }
  };

  /** ----- cell edit + persistence ----- */
  const handleEdit = async (id: string, key: string, value: unknown) => {
    setShipments((prev) => prev.map((s) => (s._id === id ? { ...s, [key]: value } : s)));

    await fetch(`/api/shipments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  };

  /** ----- drag reorder (UI only) ----- */
  const handleDragStart = (index: number) => setDraggedColIndex(index);
  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => e.preventDefault();
  const handleDrop = (index: number) => {
    if (draggedColIndex === null || draggedColIndex === index) return;
    const reordered = [...columns];
    const [moved] = reordered.splice(draggedColIndex, 1);
    reordered.splice(index, 0, moved);
    setColumns(reordered);
    setDraggedColIndex(null);
  };

  /** ----- render helpers ----- */
  const renderCellContent = (shipment: Row, key: string) => {
    const value = (shipment as any)[key];
    const isEditing = editingCell?.id === (shipment as any)._id && editingCell?.key === key;

    const nonEditableFields = ["_id", "id", "trackingNumber", "delay"];
    const editable = !nonEditableFields.includes(key) && typeof value !== "object";

    if (key.includes("|")) {
      const mergedKeys = key.split("|");
      const mergedValue = mergedKeys
        .map((k) => (shipment as any)[k])
        .find((v) => v != null && v !== "");
      return mergedValue ?? "-";
    }

    if (!isEditing) {
      if (key === "value") {
        return value ? `S$${Number(value).toLocaleString("en-SG")}` : "-";
      }
      if (key === "status") {
        return <Badge variant={getStatusColor(String(value))}>{String(value)}</Badge>;
      }
      if (key === "delay") {
        return Number(value) > 0 ? (
          <span className="text-red-600 font-medium">{String(value)}</span>
        ) : (
          <span className="text-green-600">0</span>
        );
      }
    }

    if (!editable) {
      if (typeof value === "object" && value !== null) {
        return <pre className="text-xs text-gray-600">{JSON.stringify(value, null, 2)}</pre>;
      }
      return value ?? "-";
    }

    return (
      <div className="relative group">
        {!isEditing ? (
          <div className="flex items-center justify-between group">
            <span className="truncate">
              {typeof value === "object" && value !== null ? (
                <pre className="text-xs text-gray-600">{JSON.stringify(value, null, 2)}</pre>
              ) : (
                value ?? "-"
              )}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                setEditingCell({ id: String((shipment as any)._id), key });
                setTempValue(String(value ?? ""));
              }}
              title="Edit"
            >
              ✏️
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="border border-gray-300 px-2 py-1 rounded w-full"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              size="sm"
              onClick={() => {
                handleEdit(String((shipment as any)._id), key, tempValue);
                setEditingCell(null);
              }}
              title="Confirm"
            >
              ✅
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditingCell(null)} title="Cancel">
              ❌
            </Button>
          </div>
        )}
      </div>
    );
  };

  /** ----- quick metrics ----- */
  const totalValue = shipments.reduce((sum, s) => sum + (Number((s as any).value) || 0), 0);
  const delayed = shipments.filter((s) => (s as any).status === "Delayed").length;
  const inTransit = shipments.filter((s) => (s as any).status === "In Transit").length;
  const arrived = shipments.filter((s) => (s as any).status === "Arrived").length;

  /** ----- example: top toolbar with Export ----- */
  // Place this where you render your header/toolbar:
  // <div className="flex items-center justify-between">
  //   {/* your filters/search here */}
  //   <ExportMenu
  //     table={tableInstance}
  //     fileNameBase="shipments"
  //     warehouseMap={{ eta: "eta", description: "description", qty: "qty" }}
  //   />
  // </div>

  // ...continue with your JSX below



  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/shipments">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shipments
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Incoming Shipments</h1>
                <p className="text-gray-600">Raw materials arriving from global vendors</p>
              </div>
            </div>
            <div className="flex space-x-2">
                <ExportMenu
                  rows={shipments}                // 👈 your data
                  columnSpecs={columns}           // 👈 your dynamic columns [{ key, label }]
                  fileNameBase="shipments"
                  warehouseMap={{ eta: "eta", description: "description", qty: "qty" }}
                />
              <Button size="sm">Log Incoming</Button>
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card><CardHeader><CardTitle className="text-sm">Total Incoming</CardTitle><Ship className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{shipments.length}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">In Transit</CardTitle><Clock className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{inTransit}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Delayed</CardTitle><AlertTriangle className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{delayed}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Arrived</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{arrived}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Total Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">S${totalValue.toLocaleString()}</div></CardContent></Card>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Search & Filter</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by shipment ID, vendor, or tracking number..." className="pl-10" />
              </div>
              <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 mb-4">
          <Input
            type="text"
            placeholder="New column name"
            value={newColumn}
            onChange={(e) => setNewColumn(e.target.value)}
            className="w-64"
          />

          <select
            value={newColumnType}
            onChange={(e) => setNewColumnType(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="date">Date</option>
          </select>

          <Button onClick={handleAddColumn}>Add Column</Button>
        </div>




        <Card>
          <CardHeader><CardTitle>All Incoming Shipments</CardTitle><CardDescription>Raw material shipments from overseas vendors</CardDescription></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <UiTable>
                <TableHeader>
                  <TableRow>
                    {columns.map((col, index) => (
                      <TableHead
                        key={col.key}
                        className={`${col.width} cursor-move group relative`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {editingColumn === col.key ? (
                            <input
                              className="border rounded px-1 text-sm w-full"
                              value={editingColumnLabel}
                              onChange={(e) => setEditingColumnLabel(e.target.value)}
                              onBlur={() => handleSaveColumnLabel(col.key)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveColumnLabel(col.key);
                                if (e.key === "Escape") setEditingColumn(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="hover:underline w-full"
                              onDoubleClick={() => handleEditColumn(col)}
                            >
                              {col.label}
                            </span>
                          )}

                          <button
                            className="text-red-500 opacity-0 group-hover:opacity-100 transition text-xs"
                            onClick={() => handleDeleteColumn(col.key)}
                            title="Delete column"
                          >
                            🗑️
                          </button>
                        </div>
                      </TableHead>


                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment, i) => {
                    const rk = getRowKey(shipment, i);

                    return (
                      <TableRow key={rk} className="hover:bg-gray-100 cursor-pointer">
                        {columns.map((col) => (
                          <TableCell key={`${rk}-${col.key}`} className={col.width}>
                            {renderCellContent(shipment, col.key)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>

              </UiTable>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );


}
function inferLocalDefaultValue(newColKey: string) {
  // Guess a default value based on the column key
  if (/date/i.test(newColKey)) return new Date().toISOString().slice(0, 10); // e.g. "2024-06-09"
  if (/status/i.test(newColKey)) return "Processing";
  if (/value|amount|price|cost/i.test(newColKey)) return 0;
  if (/name|vendor|supplier/i.test(newColKey)) return "";
  if (/delay/i.test(newColKey)) return 0;
  if (/tracking/i.test(newColKey)) return "";
  return "";
}


