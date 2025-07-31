// app/(your-folder)/incoming/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Search, Filter, Download, Ship, Clock, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { UserNav } from "@/components/user-nav";

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

export default function IncomingShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [newColumn, setNewColumn] = useState("");
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string, key: string } | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editingColumnLabel, setEditingColumnLabel] = useState("");



  // useEffect(() => {
  //   fetch("/api/shipments")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       if (!data.length) return;

  //       const allKeys = new Set<string>();
  //       data.forEach((s: any) => Object.keys(s).forEach(k => allKeys.add(k)));

  //       const inferredColumns = Array.from(allKeys).map((key) => ({
  //         key,
  //         label: key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
  //         width: "w-32"
  //       }));

  //       setColumns(inferredColumns);
  //       setShipments(data);
  //     });
  // }, []);

  useEffect(() => {
    const loadShipments = async () => {
      const res = await fetch("/api/shipments");
      const data = await res.json();
      if (!data.length) return;

      const allKeys = Array.from(new Set(data.flatMap(Object.keys)));

      // Call server-side Gemini normalizer
      const aliasRes = await fetch("/api/normalize-columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns: allKeys }),
      });

      const aliasMap = await aliasRes.json() as Record<string, string>;

      const inferredColumns = Object.entries(aliasMap).map(([label, rawKeys]) => ({
        key: Array.isArray(rawKeys) ? rawKeys.join("|") : rawKeys, // composite key used for merging
        label,
        width: "min-w-[200px]",
      }));


      setColumns(inferredColumns);
      setShipments(data);
    };

    loadShipments();
  }, []);

  const handleEditColumn = (col: { key: string; label: string }) => {
    setEditingColumn(col.key);
    setEditingColumnLabel(col.label);
  };

  const handleSaveColumnLabel = (key: string) => {
    setColumns(prev =>
      prev.map(col => col.key === key ? { ...col, label: editingColumnLabel } : col)
    );
    setEditingColumn(null);
  };

  const handleDeleteColumn = async (key: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete column "${key}" from all shipments?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/shipments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnKey: key }),
      });

      if (!res.ok) throw new Error("Failed to delete column");

      // Remove from columns array
      setColumns(prev => prev.filter(col => col.key !== key));
    } catch (error) {
      console.error("Delete column error:", error);
      alert("Failed to delete column.");
    }
  };


  const handleAddColumn = async () => {
    console.log("🔔 Add column triggered"); // Confirm it's called

    if (!newColumn.trim()) return;
    const newColKey = newColumn.trim().toLowerCase().replace(/\s+/g, "_");

    const newCol = {
      key: newColKey,
      label: newColumn.trim(),
      width: "w-32"
    };

    setColumns((prev) => [...prev, newCol]);
    setNewColumn("");

    await fetch("/api/shipments/add-column", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnKey: newColKey }),
    });

    setShipments((prev) => prev.map((s) => ({ ...s, [newColKey]: s[newColKey] ?? null })));
  };




  const handleEdit = async (id: string, key: string, value: any) => {
    setShipments((prev) =>
      prev.map((s) => (s._id === id ? { ...s, [key]: value } : s))
    );

    await fetch(`/api/shipments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  };

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

  // const renderCellContent = (shipment: any, key: string) => {
  //   const value = shipment[key];

  //   if (key === "value") return value?.toLocaleString() ?? "-";
  //   if (key === "status") return <Badge variant={getStatusColor(value)}>{value}</Badge>;
  //   if (key === "delay") return value > 0 ? (
  //     <span className="text-red-600 font-medium">{value}</span>
  //   ) : <span className="text-green-600">0</span>;

  //   const editable = key !== "delay" && key !== "trackingNumber" && key !== "id";

  //   if (editable) {
  //     return (
  //       <input
  //         className="bg-transparent border-b border-gray-300 focus:outline-none focus:border-black w-full"
  //         defaultValue={value ?? ""}
  //         onBlur={(e) => handleEdit(shipment._id, key, e.target.value)}
  //       />
  //     );
  //   }

  //   return value ?? "-";
  // };

  const renderCellContent = (shipment: any, key: string) => {
    const value = shipment[key];
    const isEditing = editingCell?.id === shipment._id && editingCell?.key === key;

    // Fields you don't want editable
    const nonEditableFields = ["_id", "id", "trackingNumber", "delay"];
    const editable = !nonEditableFields.includes(key) && typeof value !== "object";

    if (key.includes("|")) {
      const mergedKeys = key.split("|");
      const mergedValue = mergedKeys.map(k => shipment[k]).find(v => v != null && v !== "") ?? "-";
      return mergedValue;
    }

    // Format special fields (outside edit mode only)
    if (!isEditing) {
      if (key === "value") {
        return value ? `S$${Number(value).toLocaleString("en-SG")}` : "-";
      }

      if (key === "status") {
        return <Badge variant={getStatusColor(value)}>{value}</Badge>;
      }

      if (key === "delay") {
        return value > 0 ? (
          <span className="text-red-600 font-medium">{value}</span>
        ) : (
          <span className="text-green-600">0</span>
        );
      }
    }

    // Fallback: Not editable, just display
    if (!editable) {
      if (typeof value === "object" && value !== null) {
        return <pre className="text-xs text-gray-600">{JSON.stringify(value, null, 2)}</pre>; // or just display [object]
      }
      return value ?? "-";
    }

    // Editable field logic
    return (
      <div className="relative group">
        {!isEditing ? (
          <div className="flex items-center justify-between group">
            <span className="truncate">
              {typeof value === "object" && value !== null
                ? <pre className="text-xs text-gray-600">{JSON.stringify(value, null, 2)}</pre>
                : value ?? "-"}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                setEditingCell({ id: shipment._id, key });
                setTempValue(value ?? "");
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
                handleEdit(shipment._id, key, tempValue);
                setEditingCell(null);
              }}
              title="Confirm"
            >
              ✅
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingCell(null)}
              title="Cancel"
            >
              ❌
            </Button>
          </div>
        )}
      </div>
    );
  };



  const totalValue = shipments.reduce((sum, s) => sum + (s.value || 0), 0);
  const delayed = shipments.filter((s) => s.status === "Delayed").length;
  const inTransit = shipments.filter((s) => s.status === "In Transit").length;
  const arrived = shipments.filter((s) => s.status === "Arrived").length;


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
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
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
          <Button onClick={handleAddColumn}>
            Add Column
          </Button>
        </div>


        <Card>
          <CardHeader><CardTitle>All Incoming Shipments</CardTitle><CardDescription>Raw material shipments from overseas vendors</CardDescription></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
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
                              className="border rounded px-1 text-sm"
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
                              className="hover:underline"
                              onDoubleClick={() => handleEditColumn(col)}
                            >
                              {col.label}
                            </span>
                          )}

                          {/* Delete Button (Visible on hover) */}
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
                  {shipments.map((shipment) => (
                    <TableRow key={shipment._id} className="hover:bg-gray-100 cursor-pointer">
                      {columns.map((col) => (
                        <TableCell key={`${shipment._id}-${col.key}`} className={col.width}>
                          {renderCellContent(shipment, col.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
