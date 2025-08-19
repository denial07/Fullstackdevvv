'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, Filter, Ship, Clock, AlertTriangle } from 'lucide-react';
import { UserNav } from '@/components/user-nav';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type Column,
  type Table,
} from '@tanstack/react-table';
import { filterFns as rtFilterFns } from '@tanstack/table-core';

// ✅ exporters (hardened)
import { exportToXlsx, exportWarehouseSheet } from '@/lib/export-excel';

/** -------- helpers/types -------- */
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Arrived':
      return 'default';
    case 'In Transit':
    case 'Customs Clearance':
      return 'secondary';
    case 'Delayed':
      return 'destructive';
    case 'Processing':
      return 'outline';
    default:
      return 'secondary';
  }
};

type DataRow = Record<string, unknown>;

type ColumnSpec = {
  key: string; // may be "a|b|c" (composite)
  label: string;
  width?: string;
};

function getDefaultValueFromType(t: string) {
  switch (t) {
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'date':
      return new Date().toISOString().slice(0, 10);
    case 'string':
    default:
      return '';
  }
}

/** ---- Custom + built-in filter fns (single source of truth) ---- */
// Use `any` to avoid TS friction mixing core + custom fn signatures.
const customFilterFns: any = {
  ...rtFilterFns, // includesString, equalsString, inNumberRange, etc.
  inArray: (row: any, columnId: string, list?: string[]) => {
    if (!list || !list.length) return true;
    const v = row.getValue(columnId);
    return list.includes(String(v));
  },
  inDateRange: (row: any, columnId: string, range?: { from?: string; to?: string }) => {
    if (!range || (!range.from && !range.to)) return true;
    const raw = row.getValue(columnId);
    if (!raw) return false;
    const d = new Date(String(raw));
    if (Number.isNaN(d.getTime())) return false;
    if (range.from && d < new Date(range.from)) return false;
    if (range.to && d > new Date(range.to)) return false;
    return true;
  },
  includesAnyCI: (row: any, columnId: string, values?: string[]) => {
    if (!values || !values.length) return true;
    const s = String(row.getValue(columnId) ?? '').toLowerCase();
    return values.some((v) => s.includes(String(v).toLowerCase()));
  },
};

/** ---------- Export helpers (inline) ---------- */
const prettyFromId = (id: string) =>
  id.replace(/[_\-.]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

function getCellValue(row: any, col: Column<any, unknown>) {
  try {
    const v = row.getValue(col.id);
    if (v !== undefined) return v;
  } catch { }
  const ak = (col.columnDef as any)?.accessorKey as string | undefined;
  if (ak && row.original && (row.original as any)[ak] !== undefined) return (row.original as any)[ak];
  const afn = (col.columnDef as any)?.accessorFn as ((orig: any, idx?: number) => any) | undefined;
  if (typeof afn === 'function') {
    try {
      return afn(row.original, row.index);
    } catch { }
  }
  return (row.original as any)?.[col.id];
}

function coerceForExcel(v: any): string | number | boolean | null {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) {
    try {
      return v.map(coerceForExcel).join(', ');
    } catch {
      return String(v);
    }
  }
  if (typeof v === 'object') {
    // React element / plain object
    if (React.isValidElement(v)) {
      const ch = (v as any).props?.children;
      if (typeof ch === 'string' || typeof ch === 'number' || typeof ch === 'boolean') return ch as any;
      try {
        return JSON.stringify(ch ?? '');
      } catch {
        return '';
      }
    }
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return v;
}

function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((h) => {
    const n = (seen.get(h) ?? 0) + 1;
    seen.set(h, n);
    return n === 1 ? h : `${h} (${n})`;
  });
}

function resolveColumn(table: Table<any>, hint?: string, needles: string[] = []) {
  const cols = table.getAllLeafColumns();
  const lc = (s?: string) => (s ?? '').toLowerCase();

  if (hint) {
    const h = lc(hint);
    return (
      cols.find((c) => lc(c.id) === h) ||
      cols.find((c) => lc((c.columnDef as any)?.accessorKey) === h) ||
      cols.find((c) => typeof c.columnDef.header === 'string' && lc(c.columnDef.header as string) === h)
    );
  }

  const anyMatch = (s?: string) => needles.some((n) => lc(s).includes(lc(n)));
  return (
    cols.find((c) => anyMatch(c.id)) ||
    cols.find((c) => anyMatch((c.columnDef as any)?.accessorKey)) ||
    cols.find((c) => typeof c.columnDef.header === 'string' && anyMatch(c.columnDef.header as string))
  );
}

function InlineExportButton({
  table,
  fileName = 'shipments_filtered_visible',
}: {
  table: Table<any>;
  fileName?: string;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        const visibleCols = table.getVisibleLeafColumns().filter((c) => !['select', 'actions'].includes(c.id));
        const sel = table.getSelectedRowModel().rows;
        const rows = sel.length ? sel : table.getFilteredRowModel().rows;

        if (!rows.length) return alert('No rows to export.');
        if (!visibleCols.length) return alert('No visible columns to export.');

        const rawHeaders = visibleCols.map((c) =>
          typeof c.columnDef.header === 'string' ? (c.columnDef.header as string) : prettyFromId(c.id)
        );
        const headers = uniqueHeaders(rawHeaders);

        const data = rows.map((r) =>
          Object.fromEntries(visibleCols.map((c, i) => [headers[i], coerceForExcel(getCellValue(r, c))]))
        );

        exportToXlsx(data, { fileName, sheetName: 'Filtered', headerOrder: headers });
      }}
    >
      Export
    </Button>
  );
}

function InlineWarehouseExport({
  table,
  fileName = 'shipments_warehouse',
  warehouseMap,
}: {
  table: Table<any>;
  fileName?: string;
  warehouseMap?: { eta?: string; description?: string; qty?: string };
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        const rows = table.getSelectedRowModel().rows.length
          ? table.getSelectedRowModel().rows
          : table.getFilteredRowModel().rows;
        if (!rows.length) return alert('No rows to export.');

        const etaCol = resolveColumn(table, warehouseMap?.eta, ['eta', 'arrival', 'expected']);
        const descCol = resolveColumn(table, warehouseMap?.description, ['description', 'desc']);
        const qtyCol = resolveColumn(table, warehouseMap?.qty, ['qty', 'quantity', 'container']);

        const missing = [!etaCol && 'ETA', !descCol && 'Description', !qtyCol && 'Qty (container)'].filter(Boolean);
        if (missing.length) alert(`Missing column(s): ${missing.join(', ')}`);

        const data = rows.map((r: any, i: number) => ({
          'No.': i + 1,
          ETA: etaCol ? coerceForExcel(getCellValue(r, etaCol)) : '',
          Description: descCol ? coerceForExcel(getCellValue(r, descCol)) : '',
          'Qty (container)': qtyCol ? coerceForExcel(getCellValue(r, qtyCol)) : '',
        }));

        exportWarehouseSheet(data, { fileName });
      }}
    >
      Warehouse XLSX
    </Button>
  );
}

/** ---------------- PAGE ---------------- */
export default function InternalShipmentsPage() {
  // dynamic data & columns
  const [shipments, setShipments] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<ColumnSpec[]>([]);

  // ui states
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; key: string } | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editingColumnLabel, setEditingColumnLabel] = useState<string>('');
  const [newColumn, setNewColumn] = useState('');
  const [newColumnType, setNewColumnType] = useState('string');

  // search + filters state
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // UI filter models
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [etaRange, setEtaRange] = useState<{ from?: string; to?: string }>({});
  const [valueRange, setValueRange] = useState<{ min?: number; max?: number }>({});
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [trackingContains, setTrackingContains] = useState<string>('');

  useEffect(() => {
    const loadShipments = async () => {
      const res = await fetch('/api/shipments');
      const data: DataRow[] = await res.json();
      if (!data.length) {
        setShipments([]);
        setColumns([]);
        return;
      }

      const rawKeys = Array.from(new Set(data.flatMap(Object.keys)));
      const typeKeys = rawKeys.filter((k) => /type/i.test(k));

      const getTypeVal = (row: DataRow) => {
        for (const k of typeKeys) {
          const v = (row as any)[k as keyof DataRow];
          if (v != null) return String(v);
        }
        return (row as any).type ?? (row as any).Type ?? undefined;
      };

      const internal = data.filter((r) => getTypeVal(r)?.toLowerCase() === 'internal');
      if (!internal.length) {
        setShipments([]);
        setColumns([]);
        return;
      }

      const filteredKeys = Array.from(new Set(internal.flatMap(Object.keys)));

      const aliasRes = await fetch('/api/normalize-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: filteredKeys }),
      });

      const aliasMap = (await aliasRes.json()) as Record<string, string | string[]>;

      const inferredColumns: ColumnSpec[] = Object.entries(aliasMap).map(([label, raw]) => ({
        key: Array.isArray(raw) ? raw.join('|') : raw,
        label,
        width: 'min-w-[200px]',
      }));

      setColumns(inferredColumns);
      setShipments(internal);
    };

    loadShipments();
  }, []);

  /** ----- identify columns for filters / warehouse ----- */
  const statusColId = useMemo(
    () => columns.find((c) => /status/i.test(c.key) || /status/i.test(c.label))?.key,
    [columns]
  );
  const etaColId = useMemo(
    () =>
      columns.find(
        (c) => /\beta\b|eta|arrival|date/i.test(c.key) || /\bETA\b|Arrival|Date/i.test(c.label)
      )?.key,
    [columns]
  );
  const valueColId = useMemo(
    () =>
      columns.find(
        (c) =>
          /declaredvalue|value|amount|price|cost/i.test(c.key) ||
          /Value|Amount|Price/i.test(c.label)
      )?.key,
    [columns]
  );
  const vendorColId = useMemo(
    () => columns.find((c) => /vendor|supplier/i.test(c.key) || /Vendor|Supplier/i.test(c.label))?.key,
    [columns]
  );
  const originColId = useMemo(
    () =>
      columns.find(
        (c) => /origin|country|port|from/i.test(c.key) || /Origin|Country|Port/i.test(c.label)
      )?.key,
    [columns]
  );
  const trackingColId = useMemo(
    () => columns.find((c) => /tracking/i.test(c.key) || /Tracking/i.test(c.label))?.key,
    [columns]
  );
  const descriptionColId = useMemo(
    () => columns.find((c) => /description|desc/i.test(c.key) || /Description|Desc/i.test(c.label))?.key,
    [columns]
  );
  const qtyColId = useMemo(
    () =>
      columns.find(
        (c) => /(qty|quantity|container)/i.test(c.key) || /(Qty|Quantity|Container)/i.test(c.label)
      )?.key,
    [columns]
  );

  /** ----- column defs for TanStack ----- */
  const columnDefs = useMemo<ColumnDef<DataRow>[]>(() => {
    return columns.map((c) => {
      const isStatus = c.key === statusColId;
      const isEta = c.key === etaColId;
      const isValue = c.key === valueColId;
      const isVendor = c.key === vendorColId;
      const isOrigin = c.key === originColId;
      const isTracking = c.key === trackingColId;

      return {
        id: c.key,
        header: c.label || c.key,
        enableGlobalFilter: true,
        filterFn: isStatus
          ? 'inArray'
          : isEta
            ? 'inDateRange'
            : isValue
              ? 'inNumberRange'
              : isVendor
                ? 'inArray'
                : isOrigin
                  ? 'inArray'
                  : isTracking
                    ? 'includesString'
                    : 'includesString',
        accessorFn: (row) => {
          if (c.key.includes('|')) {
            const parts = c.key.split('|');
            const val = parts
              .map((k) => (row as any)[k])
              .find((v) => v !== undefined && v !== null && v !== '');
            return val ?? '';
          }
          return (row as any)[c.key];
        },
      } as ColumnDef<DataRow>;
    });
  }, [columns, statusColId, etaColId, valueColId, vendorColId, originColId, trackingColId]);

  /** ----- table instance ----- */
  const tableInstance = useReactTable<DataRow>({
    data: shipments,
    columns: columnDefs,
    filterFns: customFilterFns,
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /** ----- options for multi-selects (from pre-filtered) ----- */
  const statusOptions = useMemo(() => {
    if (!statusColId) return [] as string[];
    const set = new Set<string>();
    tableInstance.getPreFilteredRowModel().flatRows.forEach((r) => {
      const v = r.getValue(statusColId);
      if (v != null && v !== '') set.add(String(v));
    });
    return Array.from(set).sort();
  }, [tableInstance, statusColId]);

  const vendorOptions = useMemo(() => {
    if (!vendorColId) return [] as string[];
    const set = new Set<string>();
    tableInstance.getPreFilteredRowModel().flatRows.forEach((r) => {
      const v = r.getValue(vendorColId);
      if (v != null && v !== '') set.add(String(v));
    });
    return Array.from(set).sort();
  }, [tableInstance, vendorColId]);

  const originOptions = useMemo(() => {
    if (!originColId) return [] as string[];
    const set = new Set<string>();
    tableInstance.getPreFilteredRowModel().flatRows.forEach((r) => {
      const v = r.getValue(originColId);
      if (v != null && v !== '') set.add(String(v));
    });
    return Array.from(set).sort();
  }, [tableInstance, originColId]);

  /** ----- sync UI filters -> columnFilters ----- */
  useEffect(() => {
    setColumnFilters((prev) => {
      const idsToRemove = [statusColId, etaColId, valueColId, vendorColId, originColId, trackingColId].filter(
        Boolean
      ) as string[];

      const next = prev.filter((f) => !idsToRemove.includes(f.id));

      if (statusColId && selectedStatuses.length) next.push({ id: statusColId, value: selectedStatuses });

      if (etaColId && (etaRange.from || etaRange.to)) next.push({ id: etaColId, value: { ...etaRange } });

      if (valueColId && (valueRange.min != null || valueRange.max != null))
        next.push({ id: valueColId, value: { ...valueRange } });

      if (vendorColId && selectedVendors.length) next.push({ id: vendorColId, value: selectedVendors });

      if (originColId && selectedOrigins.length) next.push({ id: originColId, value: selectedOrigins });

      if (trackingColId && trackingContains.trim())
        next.push({ id: trackingColId, value: trackingContains.trim() });

      return next;
    });
  }, [
    selectedStatuses,
    etaRange,
    valueRange,
    selectedVendors,
    selectedOrigins,
    trackingContains,
    statusColId,
    etaColId,
    valueColId,
    vendorColId,
    originColId,
    trackingColId,
  ]);

  /** ----- header editing / add / delete ----- */
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
      const res = await fetch('/api/shipments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldKey, newKey }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert('❌ Failed to rename column: ' + (errorData.error || 'Unknown error'));
        throw new Error('Rename failed');
      }

      setColumns((prev) => prev.map((col) => (col.key === oldKey ? { ...col, key: newKey, label: newKey } : col)));
    } catch (err) {
      console.error('Rename error:', err);
      alert('Failed to rename column.');
    } finally {
      setEditingColumn(null);
    }
  };

  function getRowKey(row: DataRow, index: number): string {
    const cand = (row as any)._id ?? (row as any).id ?? (row as any).trackingNumber ?? (row as any).uuid;
    return cand != null ? String(cand) : `row-${index}`;
  }

  const handleDeleteColumn = async (key: string) => {
    const ok = window.confirm(`Are you sure you want to delete column "${key}" from all shipments?`);
    if (!ok) return;

    try {
      const res = await fetch('/api/shipments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnKey: key }),
      });
      if (!res.ok) throw new Error('Failed to delete column');
      setColumns((prev) => prev.filter((c) => c.key !== key));
    } catch (err) {
      console.error('Delete column error:', err);
      alert('Failed to delete column.');
    }
  };

  const handleAddColumn = async () => {
    if (!newColumn.trim()) return;
    const newColKey = newColumn.trim().toLowerCase().replace(/\s+/g, '_');

    const newCol: ColumnSpec = {
      key: newColKey,
      label: newColumn.trim(),
      width: 'w-32',
    };

    setColumns((prev) => [...prev, newCol]);
    setNewColumn('');

    try {
      const res = await fetch('/api/shipments/add-column', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnKey: newColKey, columnType: newColumnType }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to add column');

      const defaultValue = getDefaultValueFromType(newColumnType);
      setShipments((prev) => prev.map((s) => ({ ...s, [newColKey]: (s as any)[newColKey] ?? defaultValue })));
    } catch (err) {
      console.error('❌ Error adding column:', err);
      alert('Error adding column: ' + (err as Error).message);
    }
  };

  /** ----- cell edit + persistence ----- */
  const handleEdit = async (id: string, key: string, value: unknown) => {
    setShipments((prev) => prev.map((s) => ((s as any)._id === id ? { ...s, [key]: value } : s)));

    await fetch(`/api/shipments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
  const renderCellContent = (shipment: DataRow, key: string) => {
    const value = (shipment as any)[key];
    const isEditing = editingCell?.id === (shipment as any)._id && editingCell?.key === key;

    const nonEditableFields = ['_id', 'id', 'trackingNumber', 'delay'];
    const editable = !nonEditableFields.includes(key) && typeof value !== 'object';

    if (key.includes('|')) {
      const mergedKeys = key.split('|');
      const mergedValue = mergedKeys.map((k) => (shipment as any)[k]).find((v) => v != null && v !== '');
      return mergedValue ?? '-';
    }

    if (!isEditing) {
      if (key === 'value') {
        return value ? `S$${Number(value).toLocaleString('en-SG')}` : '-';
      }
      if (key === 'status') {
        return <Badge variant={getStatusColor(String(value))}>{String(value)}</Badge>;
      }
      if (key === 'delay') {
        return Number(value) > 0 ? (
          <span className="text-red-600 font-medium">{String(value)}</span>
        ) : (
          <span className="text-green-600">0</span>
        );
      }
    }

    if (!editable) {
      if (typeof value === 'object' && value !== null) {
        return <pre className="text-xs text-gray-600">{JSON.stringify(value, null, 2)}</pre>;
      }
      return value ?? '-';
    }

    return (
      <div className="relative group">
        {!isEditing ? (
          <div className="flex items-center justify-between group">
            <span className="truncate">
              {typeof value === 'object' && value !== null ? (
                <pre className="text-xs text-gray-600">{JSON.stringify(value, null, 2)}</pre>
              ) : (
                value ?? '-'
              )}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                setEditingCell({ id: String((shipment as any)._id), key });
                setTempValue(String(value ?? ''));
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

  /** ----- metrics from FILTERED data ----- */
  const filteredRows = tableInstance.getFilteredRowModel().rows;
  const filteredData: DataRow[] = filteredRows.map((r) => r.original as DataRow);

  const totalValue = filteredData.reduce((sum, s) => sum + (Number((s as any).declaredvalue) || 0), 0);
  const delayed = filteredData.filter((s) => (s as any).status === 'Delayed').length;
  const inTransit = filteredData.filter((s) => (s as any).status === 'In Transit').length;
  const arrived = filteredData.filter((s) => ['Delivered', 'Arrived'].includes(String((s as any).status))).length;

  const warehouseIds = {
    eta: etaColId ?? 'eta',
    description: descriptionColId ?? 'description',
    qty: qtyColId ?? 'qty',
  } as const;

  function clearAllFilters() {
    setGlobalFilter('');
    setSelectedStatuses([]);
    setEtaRange({});
    setValueRange({});
    setSelectedVendors([]);
    setSelectedOrigins([]);
    setTrackingContains('');
    setColumnFilters([]);
  }

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
                <h1 className="text-3xl font-bold text-gray-900">Internal Shipments</h1>
                <p className="text-gray-600">Raw materials arriving from global vendors</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {/* ✅ Inline exporters (no external component needed) */}
              <InlineExportButton table={tableInstance} fileName="shipments_filtered_visible" />
              <InlineWarehouseExport table={tableInstance} warehouseMap={warehouseIds} />
              <Button size="sm">Log Internal</Button>
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Internal (filtered)</CardTitle>
              <Ship className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">In Transit</CardTitle>
              <Clock className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inTransit}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Delayed</CardTitle>
              <AlertTriangle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{delayed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Arrived</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{arrived}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S${totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search across all columns..."
                  className="pl-10"
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
              <Button variant={filtersOpen ? 'default' : 'outline'} onClick={() => setFiltersOpen((v) => !v)}>
                <Filter className="h-4 w-4 mr-2" /> {filtersOpen ? 'Hide Filters' : 'Filters'}
              </Button>
              <Button variant="ghost" onClick={clearAllFilters} className="sm:w-auto w-full">
                Reset
              </Button>
            </div>

            {filtersOpen && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-lg p-4 bg-muted/30">
                {/* Status */}
                {statusColId && (
                  <div>
                    <div className="text-sm font-medium mb-2">Status</div>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((s) => {
                        const active = selectedStatuses.includes(s);
                        return (
                          <button
                            key={s}
                            onClick={() =>
                              setSelectedStatuses((prev) =>
                                prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                              )
                            }
                            className={`px-2 py-1 rounded border text-sm ${active ? 'bg-primary text-primary-foreground' : 'bg-white'
                              }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ETA range */}
                {etaColId && (
                  <div>
                    <div className="text-sm font-medium mb-2">ETA range</div>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={etaRange.from ?? ''}
                        onChange={(e) => setEtaRange((r) => ({ ...r, from: e.target.value }))}
                      />
                      <Input
                        type="date"
                        value={etaRange.to ?? ''}
                        onChange={(e) => setEtaRange((r) => ({ ...r, to: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Value range */}
                {valueColId && (
                  <div>
                    <div className="text-sm font-medium mb-2">Value (min / max)</div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={valueRange.min ?? ''}
                        onChange={(e) =>
                          setValueRange((r) => ({
                            ...r,
                            min: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={valueRange.max ?? ''}
                        onChange={(e) =>
                          setValueRange((r) => ({
                            ...r,
                            max: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Vendor */}
                {vendorColId && (
                  <div>
                    <div className="text-sm font-medium mb-2">Vendor</div>
                    <div className="flex flex-wrap gap-2">
                      {vendorOptions.map((v) => {
                        const active = selectedVendors.includes(v);
                        return (
                          <button
                            key={v}
                            onClick={() =>
                              setSelectedVendors((prev) =>
                                prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
                              )
                            }
                            className={`px-2 py-1 rounded border text-sm ${active ? 'bg-primary text-primary-foreground' : 'bg-white'
                              }`}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Origin */}
                {originColId && (
                  <div>
                    <div className="text-sm font-medium mb-2">Origin</div>
                    <div className="flex flex-col gap-2 max-h-40 overflow-auto pr-1">
                      {originOptions.map((o) => {
                        const checked = selectedOrigins.includes(o);
                        return (
                          <label key={o} className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setSelectedOrigins((prev) =>
                                  e.target.checked ? [...prev, o] : prev.filter((x) => x !== o)
                                )
                              }
                            />
                            {o}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tracking contains */}
                {trackingColId && (
                  <div>
                    <div className="text-sm font-medium mb-2">Tracking contains</div>
                    <Input
                      placeholder="e.g. DHL / 1Z..."
                      value={trackingContains}
                      onChange={(e) => setTrackingContains(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add column */}
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

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Internal Shipments</CardTitle>
            <CardDescription>Raw material shipments from overseas vendors</CardDescription>
          </CardHeader>
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
                                if (e.key === 'Enter') handleSaveColumnLabel(col.key);
                                if (e.key === 'Escape') setEditingColumn(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            <span className="hover:underline w-full" onDoubleClick={() => handleEditColumn(col)}>
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
                  {tableInstance.getFilteredRowModel().rows.map((row) => {
                    const rk = getRowKey(row.original as DataRow, row.index);
                    return (
                      <TableRow key={rk} className="hover:bg-gray-100 cursor-pointer">
                        {columns.map((col) => (
                          <TableCell key={`${rk}-${col.key}`} className={col.width}>
                            {renderCellContent(row.original as DataRow, col.key)}
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

// (Optional) Keep your local default guesser
function inferLocalDefaultValue(newColKey: string) {
  if (/date/i.test(newColKey)) return new Date().toISOString().slice(0, 10);
  if (/status/i.test(newColKey)) return 'Processing';
  if (/value|amount|price|cost/i.test(newColKey)) return 0;
  if (/name|vendor|supplier/i.test(newColKey)) return '';
  if (/delay/i.test(newColKey)) return 0;
  if (/tracking/i.test(newColKey)) return '';
  return '';
}
