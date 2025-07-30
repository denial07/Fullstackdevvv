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

  useEffect(() => {
    fetch("/api/shipments")
      .then((res) => res.json())
      .then((data) => {
        if (!data.length) return;

        const allKeys = new Set<string>();
        data.forEach((s: any) => Object.keys(s).forEach(k => allKeys.add(k)));

        const inferredColumns = Array.from(allKeys).map((key) => ({
          key,
          label: key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
          width: "w-32"
        }));

        setColumns(inferredColumns);
        setShipments(data);
      });
  }, []);

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

  const renderCellContent = (shipment: any, key: string) => {
    const value = shipment[key];

    if (key === "value") return value?.toLocaleString() ?? "-";
    if (key === "status") return <Badge variant={getStatusColor(value)}>{value}</Badge>;
    if (key === "delay") return value > 0 ? (
      <span className="text-red-600 font-medium">{value}</span>
    ) : <span className="text-green-600">0</span>;

    const editable = key !== "delay" && key !== "trackingNumber" && key !== "id";

    if (editable) {
      return (
        <input
          className="bg-transparent border-b border-gray-300 focus:outline-none focus:border-black w-full"
          defaultValue={value ?? ""}
          onBlur={(e) => handleEdit(shipment._id, key, e.target.value)}
        />
      );
    }

    return value ?? "-";
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
                        className={`${col.width} cursor-move`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                      >
                        {col.label}
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
