'use client'

// app/(dashboard)/page.tsx — Revamped client dashboard
// Shipment summary & trends are derived from shipments data (recentShipments).
// Inventory-related code is untouched. Data still comes from /api/dashboard and /api/explore.

import { useEffect, useMemo, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Ship, Package, AlertTriangle, Clock, TrendingDown, MessageCircle, Loader2, Info } from 'lucide-react'
import { ChatBot } from '@/components/chatbot'

import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// ---------------- Types (matches /api/dashboard response where relevant) ----------------
type ShipmentSummary = { total: number; inTransit: number; delayed: number; arrived: number; totalValue: number }
type InventorySummary = { totalItems: number; lowStock: number; expiringSoon: number; expired: number; totalValue: number }

// Trends now derived from shipments: weekly counts by status
type ShipmentTrendPoint = { week: string; inTransit: number; arrived: number; delayed: number }
type InventoryValueSlice = { name: string; value: number }
type DailyOpsPoint = { day: string; shipments: number; inventory: number }
type RecentShipment = { id: string; vendor: string; status: 'In Transit' | 'Delayed' | 'Arrived'; expectedArrival: string; value: number; delay: number }
type CriticalInventory = { id: string; item: string; quantity: number; unit: string; expiryDate: string; status: 'Low Stock' | 'Expiring Soon' | 'Expired' }

// NOTE: shipmentSummary and shipmentTrends removed from API shape; we derive them from recentShipments.
type DashboardData = {
  inventorySummary: InventorySummary
  inventoryValueDist: InventoryValueSlice[]
  dailyOps: DailyOpsPoint[]
  recentShipments: RecentShipment[]          // ← source of truth for shipments
  criticalInventory: CriticalInventory[]
}

const COLORS = ['#1e40af', '#059669', '#d97706', '#dc2626', '#64748b']

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Client-friendly controls (like other SaaS dashboards)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/dashboard?period=${period}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch /api/dashboard')
        const json = (await res.json()) as DashboardData
        setData(json)
      } catch (e: any) {
        setError(e?.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [period])

  // ---------- Derived insights (computed on safe fallbacks to obey Rules of Hooks) ----------
  const recentShipmentsArr = data?.recentShipments ?? []
  const criticalInventoryArr = data?.criticalInventory ?? []

  // (1) Shipment KPIs derived from shipments data
  const shipmentSummary: ShipmentSummary = useMemo(() => {
    let inTransit = 0, delayed = 0, arrived = 0, totalValue = 0
    for (const s of recentShipmentsArr) {
      if (s.status === 'In Transit') inTransit++
      if (s.status === 'Arrived') arrived++
      // treat any positive delay or explicit 'Delayed' status as delayed
      if (s.status === 'Delayed' || (s.delay || 0) > 0) delayed++
      totalValue += Number(s.value || 0)
    }
    return {
      total: recentShipmentsArr.length,
      inTransit,
      delayed,
      arrived,
      totalValue
    }
  }, [recentShipmentsArr])

  // (2) Shipment trends derived from shipments data
  const shipmentTrends: ShipmentTrendPoint[] = useMemo(() => {
    // Group by start-of-week (Mon) using expectedArrival
    const map = new Map<string, { ts: number; inTransit: number; arrived: number; delayed: number }>()
    for (const s of recentShipmentsArr) {
      const key = weekKeyFromISO(s.expectedArrival)
      if (!key) continue
      const row = map.get(key) || { ts: new Date(key).getTime(), inTransit: 0, arrived: 0, delayed: 0 }
      if (s.status === 'In Transit') row.inTransit++
      if (s.status === 'Arrived') row.arrived++
      if (s.status === 'Delayed' || (s.delay || 0) > 0) row.delayed++
      map.set(key, row)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[1].ts - b[1].ts)
      .map(([week, v]) => ({ week: formatWeekLabel(week), inTransit: v.inTransit, arrived: v.arrived, delayed: v.delayed }))
  }, [recentShipmentsArr])

  // Additional KPIs derived from shipments
  const { recentOnTimeRate, avgDelayDays } = useMemo(() => {
    const arrived = recentShipmentsArr.filter(s => s.status === 'Arrived')
    const onTime = arrived.filter(s => (s.delay || 0) <= 0).length
    const rate = arrived.length ? Math.round((onTime / arrived.length) * 100) : 0
    const delays = recentShipmentsArr.map(s => Math.max(0, s.delay || 0))
    const avg = delays.length ? (delays.reduce((a, b) => a + b, 0) / delays.length) : 0
    return { recentOnTimeRate: rate, avgDelayDays: Number(avg.toFixed(1)) }
  }, [recentShipmentsArr])

  const vendorRows = useMemo(() => {
    const map = new Map<string, { vendor: string; total: number; delayed: number; declaredvalue: number }>()
    for (const s of recentShipmentsArr) {
      const key = s.vendor || 'Unknown'
      const row = map.get(key) || { vendor: key, total: 0, delayed: 0, declaredvalue: 0 }
      row.total += 1
      row.delayed += (s.status === 'Delayed' || (s.delay || 0) > 0) ? 1 : 0
      row.declaredvalue += Number(s.value || 0)
      map.set(key, row)
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [recentShipmentsArr])

  const alerts = useMemo(() => {
    const delayedShipments = recentShipmentsArr.filter(s => s.status === 'Delayed' || (s.delay || 0) > 0)
    const expiring = criticalInventoryArr.filter(i => i.status === 'Expiring Soon' || i.status === 'Expired')
    return { delayedShipments, expiring }
  }, [recentShipmentsArr, criticalInventoryArr])

  // ---------- Early returns after all hooks are declared ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        <span>Loading dashboard…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-semibold">
        Error: {error}
      </div>
    )
  }

  if (!data) return null

  // Pull only inventory data & supporting fields from API; shipments are already in recentShipments
  const { inventorySummary, inventoryValueDist, dailyOps } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold text-slate-900">Operations Dashboard</h1>
            <p className="text-sm text-slate-600">Real-time view of shipments and inventory health</p>
          </div>
          {/* Period control (optional)
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Period</label>
            <select className="border rounded px-2 py-1" value={period} onChange={(e) => setPeriod(e.target.value as any)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div> */}
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <KpiTile
            label="Active Shipments"
            value={shipmentSummary.total.toString()}
            hint={`${shipmentSummary.delayed} delayed`}
            icon={<Ship className="h-4 w-4 text-blue-700" />}
          />
          {/* Inventory KPIs left untouched */}
          <KpiTile label="Low Stock" value={inventorySummary.lowStock.toString()} icon={<TrendingDown className="h-4 w-4 text-gray-600" />} />
          <KpiTile label="Expiring Soon" value={inventorySummary.expiringSoon.toString()} icon={<AlertTriangle className="h-4 w-4 text-red-600" />} />
          <KpiTile label="Inventory Value" value={`S$${(inventorySummary.totalValue || 0).toLocaleString()}`} icon={<Package className="h-4 w-4 text-emerald-600" />} />
        </div>

        {/* Sections */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-black">Analytics</TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-white data-[state=active]:text-black">Alerts</TabsTrigger>
            <TabsTrigger value="vendors" className="data-[state=active]:bg-white data-[state=active]:text-black">Vendors</TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black">Overview</TabsTrigger>
          </TabsList>

          {/* ANALYTICS */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Explore panel (drag & drop) */}
            <ExplorePanel />

            {/* Key analytics */}
            <AnalyticsCharts shipmentTrends={shipmentTrends} inventoryValueDist={inventoryValueDist} dailyOps={dailyOps} />
          </TabsContent>

          {/* ALERTS */}
          <TabsContent value="alerts" className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Exceptions</CardTitle>
                <CardDescription className="text-slate-600">Items needing attention now</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-red-600" /><span className="text-sm font-medium">Delayed Shipments</span></div>
                  <div className="space-y-3">
                    {alerts.delayedShipments.length === 0 && <p className="text-sm text-slate-500">No delays detected in recent shipments.</p>}
                    {alerts.delayedShipments.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-3 border rounded bg-white">
                        <div className="text-sm"><span className="font-medium">{s.id}</span> • {s.vendor || 'Unknown'}</div>
                        <div className="text-sm text-red-600">{Math.max(0, s.delay)} days delayed</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-amber-600" /><span className="text-sm font-medium">Expiring / Expired Inventory</span></div>
                  <div className="space-y-3">
                    {alerts.expiring.length === 0 && <p className="text-sm text-slate-500">No expiring items in the current window.</p>}
                    {alerts.expiring.map((i) => (
                      <div key={i.id} className="flex items-center justify-between p-3 border rounded bg-white">
                        <div className="text-sm"><span className="font-medium">{i.item}</span> • {i.quantity} {i.unit}</div>
                        <div className="text-xs"><Badge className={badgeClassForInventory(i.status)}>{i.status}</Badge></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-500 text-xs">
                  <Info className="h-4 w-4" />
                  <p>Tip: Use the Analytics tab to see trends and the Vendors tab to pinpoint chronic delays.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VENDORS */}
          <TabsContent value="vendors" className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Vendor Performance (recent)</CardTitle>
                <CardDescription className="text-slate-600">Top vendors by shipments and delays</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="py-2">Vendor</th>
                        <th className="py-2">Shipments</th>
                        <th className="py-2">Delayed</th>
                        <th className="py-2">On-time %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorRows.map(v => {
                        const onTime = v.total ? Math.round(((v.total - v.delayed) / v.total) * 100) : 0
                        return (
                          <tr key={v.vendor} className="border-t">
                            <td className="py-2">{v.vendor || 'Unknown'}</td>
                            <td className="py-2">{v.total}</td>
                            <td className="py-2">{v.delayed}</td>
                            <td className="py-2">{onTime}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Shipment Status (derived) */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Shipment Status</CardTitle>
                  <CardDescription className="text-slate-600">Current status of all shipments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BarRow label="In Transit" value={shipmentSummary.inTransit} total={shipmentSummary.total} />
                  <BarRow label="Delayed" value={shipmentSummary.delayed} total={shipmentSummary.total} />
                  <BarRow label="Arrived" value={shipmentSummary.arrived} total={shipmentSummary.total} />
                </CardContent>
              </Card>

              {/* Inventory Health (untouched) */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Inventory Health</CardTitle>
                  <CardDescription className="text-slate-600">Stock levels and expiry status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BarRow label="Normal Stock" value={Math.max(0, (inventorySummary.totalItems || 0) - (inventorySummary.lowStock || 0))} total={inventorySummary.totalItems || 0} />
                  <BarRow label="Low Stock" value={inventorySummary.lowStock || 0} total={inventorySummary.totalItems || 0} />
                  <BarRow label="Expiring Soon" value={inventorySummary.expiringSoon || 0} total={inventorySummary.totalItems || 0} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Chatbot Toggle */}
      <Button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl">
        <MessageCircle className="h-6 w-6" />
      </Button>
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}

// ---------------- Small client helpers ----------------
function KpiTile({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-slate-600">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold text-gray-900">{value}</div>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function BarRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? (value / total) * 100 : 0
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-slate-700">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value}</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  )
}

function badgeClassForInventory(status: CriticalInventory['status']) {
  if (status === 'Expired') return 'bg-red-600 text-white'
  if (status === 'Expiring Soon') return 'bg-amber-600 text-white'
  return 'bg-gray-500 text-white'
}

// Format week key "YYYY-MM-DD" → "MMM d" label (start-of-week)
function formatWeekLabel(weekKey: string) {
  try {
    const d = new Date(weekKey)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch { return weekKey }
}

// Get Monday start-of-week ISO date (YYYY-MM-DD) from an ISO string; returns '' if invalid
function weekKeyFromISO(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  // Normalize to local midnight
  d.setHours(0, 0, 0, 0)
  // JS: 0 Sun, 1 Mon, …; shift to Monday-based week
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day) // if Sun(0), go back 6 days; else back to Mon
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  const yyyy = monday.getFullYear()
  const mm = String(monday.getMonth() + 1).padStart(2, '0')
  const dd = String(monday.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function AnalyticsCharts({
  shipmentTrends: _shipmentTrends,
  inventoryValueDist = [],
  dailyOps: _dailyOps = [],
}: {
  shipmentTrends: ShipmentTrendPoint[]
  inventoryValueDist: InventoryValueSlice[]
  dailyOps: DailyOpsPoint[]
}) {
  return (
    <>
      {/* Inventory value distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Inventory Value Distribution</CardTitle>
            <CardDescription className="text-slate-600">Current inventory value by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={inventoryValueDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {inventoryValueDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`S$${Number(v ?? 0).toLocaleString()}`, 'Value']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily operations (optional chart retained for future use)
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Daily Operations Overview</CardTitle>
          <CardDescription className="text-slate-600">Weekly activity across shipments and inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={_dailyOps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="shipments" stroke="#1e40af" strokeWidth={2} name="Shipments" />
              <Line type="monotone" dataKey="inventory" stroke="#d97706" strokeWidth={2} name="Inventory Updates" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}
    </>
  )
}

// ---------------- Explore (Drag & Drop) ----------------
function ExplorePanel() {
  const [dataset, setDataset] = useState<'shipments' | 'inventory'>('shipments')
  const [groupBy, setGroupBy] = useState<string>('status')
  const [measure, setMeasure] = useState<{ op: 'count' | 'sum' | 'avg'; field?: string }>({ op: 'count' })
  const [rows, setRows] = useState<Array<{ key: string; value: number }>>([])
  const [loading, setLoading] = useState(false)

  const dims = dataset === 'shipments' ? ['status', 'vendor'] : ['category', 'status']
  const meas = dataset === 'shipments' ? ['count', 'value'] : ['count', 'value']

  async function runQuery() {
    setLoading(true)
    try {
      const body: any = { dataset, groupBy, agg: measure }
      const res = await fetch('/api/explore', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      setRows(json.rows || [])
    } finally {
      setLoading(false)
    }
  }

  function onDragStart(e: React.DragEvent, payload: string) {
    e.dataTransfer.setData('text/plain', payload)
  }
  function onDropShelf(e: React.DragEvent, shelf: 'group' | 'measure') {
    e.preventDefault()
    const txt = e.dataTransfer.getData('text/plain')
    if (!txt) return
    const [kind, name] = txt.split(':')
    if (shelf === 'group' && kind === 'dim') setGroupBy(name)
    if (shelf === 'measure' && kind === 'mea') {
      if (name === 'count') setMeasure({ op: 'count' })
      else setMeasure({ op: 'sum', field: name })
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-900">Explore (Drag & Drop)</CardTitle>
        <CardDescription className="text-slate-600">Drag fields onto shelves, then Run</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm">Dataset</label>
          <select
            className="border rounded px-2 py-1"
            value={dataset}
            onChange={(e) => { setDataset(e.target.value as any); setGroupBy('status'); setMeasure({ op: 'count' }); setRows([]); }}
          >
            <option value="shipments">Shipments</option>
            <option value="inventory">Inventory</option>
          </select>
          <Button size="sm" onClick={runQuery} disabled={loading}>{loading ? 'Running…' : 'Run'}</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold mb-2">Dimensions</div>
            <div className="flex flex-wrap gap-2">
              {dims.map((d) => (
                <span
                  key={d}
                  draggable
                  onDragStart={(e) => onDragStart(e, `dim:${d}`)}
                  className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs cursor-grab"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold mb-2">Measures</div>
            <div className="flex flex-wrap gap-2">
              {meas.map((m) => (
                <span
                  key={m}
                  draggable
                  onDragStart={(e) => onDragStart(e, `mea:${m}`)}
                  className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs cursor-grab"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropShelf(e, 'group')} className="border-2 border-dashed rounded p-3">
            <div className="text-xs font-semibold mb-1">Group by</div>
            <div className="text-sm">{groupBy || '— drop a dimension —'}</div>
          </div>
          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropShelf(e, 'measure')} className="border-2 border-dashed rounded p-3">
            <div className="text-xs font-semibold mb-1">Measure</div>
            <div className="flex items-center gap-2 text-sm">
              {measure.op === 'count' ? 'count(*)' : `${measure.op}(${measure.field})`}
              {measure.field && (
                <select className="border rounded px-1 py-0.5 text-xs" value={measure.op} onChange={(e) => setMeasure({ ...measure, op: e.target.value as any })}>
                  <option value="sum">sum</option>
                  <option value="avg">avg</option>
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#1e40af" name="Value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
