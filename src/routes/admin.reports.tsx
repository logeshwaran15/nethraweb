import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  Download,
  IndianRupee,
  LayoutGrid,
  List,
  ShoppingBag,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAdmin } from "@/lib/admin-store";
import { apiGet } from "@/lib/api";
import { inr } from "@/lib/mock-data";

type OrderRow = {
  Orderkey: string;
  OrderNumber: string;
  Total: string | number;
  Status: string;
  PaymentMethod: string;
  PaymentStatus: string;
  ShippingName: string;
  CreatedOn: string;
};

type OrderItemRow = {
  OrderKeyRef: string;
  ProductKeyRef: string;
  ProductName: string;
  Qty: string | number;
  Price: string | number;
};

const KPI_TONES = [
  {
    card: "border-emerald-200 bg-emerald-50",
    bar: "bg-emerald-500",
    text: "text-emerald-700",
    chip: "bg-emerald-500 text-white",
  },
  {
    card: "border-blue-200 bg-blue-50",
    bar: "bg-blue-500",
    text: "text-blue-700",
    chip: "bg-blue-500 text-white",
  },
  {
    card: "border-violet-200 bg-violet-50",
    bar: "bg-violet-500",
    text: "text-violet-700",
    chip: "bg-violet-500 text-white",
  },
  {
    card: "border-amber-200 bg-amber-50",
    bar: "bg-amber-500",
    text: "text-amber-700",
    chip: "bg-amber-500 text-white",
  },
];

const STATUSES = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Processing: "bg-blue-100 text-blue-800",
  Shipped: "bg-indigo-100 text-indigo-800",
  Delivered: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-800",
};

const parseDate = (s: string) => new Date(s.replace(" ", "T"));

const PRESETS: { label: string; range: () => DateRange | undefined }[] = [
  { label: "Today", range: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  {
    label: "Last 7 days",
    range: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }),
  },
  {
    label: "Last 30 days",
    range: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }),
  },
  {
    label: "This month",
    range: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }),
  },
  {
    label: "Last month",
    range: () => {
      const m = subMonths(new Date(), 1);
      return { from: startOfMonth(m), to: endOfMonth(m) };
    },
  },
  { label: "All time", range: () => undefined },
];

export default function AdminReports() {
  const { products, categories } = useAdmin();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [items, setItems] = useState<OrderItemRow[] | null>(null);
  const [error, setError] = useState(false);

  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [activePreset, setActivePreset] = useState("All time");
  const [status, setStatus] = useState("All");
  const [tab, setTab] = useState<"overview" | "orders">("overview");
  const [view, setView] = useState<"list" | "grid">("list");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGet<OrderRow[]>("/api/orders.php"),
      apiGet<OrderItemRow[]>("/api/order_items.php"),
    ])
      .then(([o, i]) => {
        setOrders(o);
        setItems(i);
      })
      .catch(() => setError(true));
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const from = range?.from ? startOfDay(range.from) : null;
    const to = range?.to ? endOfDay(range.to) : range?.from ? endOfDay(range.from) : null;
    return orders
      .filter((o) => {
        const d = parseDate(o.CreatedOn);
        if (from && d < from) return false;
        if (to && d > to) return false;
        if (status !== "All" && o.Status !== status) return false;
        return true;
      })
      .sort((a, b) => parseDate(b.CreatedOn).getTime() - parseDate(a.CreatedOn).getTime());
  }, [orders, range, status]);

  const subtitle = "Sales performance and catalogue insights";

  if (error) {
    return (
      <AdminLayout title="Reports" subtitle={subtitle}>
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load report data. Try refreshing.
        </p>
      </AdminLayout>
    );
  }

  if (!orders || !items) {
    return (
      <AdminLayout title="Reports" subtitle={subtitle}>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AdminLayout>
    );
  }

  // Cancelled orders don't count as revenue.
  const validOrders = filtered.filter((o) => o.Status !== "Cancelled");
  const revenue = validOrders.reduce((s, o) => s + Number(o.Total), 0);
  const avgOrderValue = validOrders.length ? revenue / validOrders.length : 0;
  const shippedCount = filtered.filter(
    (o) => o.Status === "Shipped" || o.Status === "Delivered",
  ).length;

  // Trend: daily buckets for short ranges, monthly otherwise.
  const validDates = validOrders.map((o) => parseDate(o.CreatedOn));
  const rangeStart =
    range?.from ??
    (validDates.length ? new Date(Math.min(...validDates.map((d) => d.getTime()))) : new Date());
  const rangeEnd = range?.to ?? range?.from ?? new Date();
  const spanDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1;
  const daily = spanDays <= 31;

  const trend = (() => {
    if (daily) {
      return Array.from({ length: spanDays }, (_, i) => {
        const day = addDays(startOfDay(rangeStart), i);
        const key = format(day, "yyyy-MM-dd");
        return {
          label: format(day, spanDays > 10 ? "d" : "dd MMM"),
          value: validOrders
            .filter((o) => format(parseDate(o.CreatedOn), "yyyy-MM-dd") === key)
            .reduce((s, o) => s + Number(o.Total), 0),
        };
      });
    }
    const map = new Map<string, number>();
    let cur = startOfMonth(rangeStart);
    while (cur <= rangeEnd) {
      map.set(format(cur, "yyyy-MM"), 0);
      cur = startOfMonth(addDays(endOfMonth(cur), 1));
    }
    for (const o of validOrders) {
      const k = format(parseDate(o.CreatedOn), "yyyy-MM");
      map.set(k, (map.get(k) ?? 0) + Number(o.Total));
    }
    return [...map.entries()].map(([k, value]) => ({
      label: format(new Date(`${k}-01T00:00:00`), "MMM yy"),
      value,
    }));
  })();
  const max = Math.max(1, ...trend.map((t) => t.value));

  const orderIds = new Set(validOrders.map((o) => o.Orderkey));
  const scopedItems = items.filter((it) => orderIds.has(it.OrderKeyRef));

  // Category breakdown: join order items -> product -> category.
  const productCategory = new Map(products.map((p) => [p.id, p.category]));
  const revenueByCategory = new Map<string, number>();
  for (const it of scopedItems) {
    const cat = productCategory.get(it.ProductKeyRef);
    if (!cat) continue;
    revenueByCategory.set(
      cat,
      (revenueByCategory.get(cat) ?? 0) + Number(it.Qty) * Number(it.Price),
    );
  }
  const maxCategoryRevenue = Math.max(1, ...revenueByCategory.values());
  const categorySales = categories
    .map((c) => ({ name: c.name, revenue: revenueByCategory.get(c.slug) ?? 0 }))
    .filter((c) => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  // Top products by revenue.
  const salesByProduct = new Map<string, { name: string; units: number; revenue: number }>();
  for (const it of scopedItems) {
    const entry = salesByProduct.get(it.ProductKeyRef) ?? {
      name: it.ProductName,
      units: 0,
      revenue: 0,
    };
    entry.units += Number(it.Qty);
    entry.revenue += Number(it.Qty) * Number(it.Price);
    salesByProduct.set(it.ProductKeyRef, entry);
  }
  const topProducts = [...salesByProduct.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const rangeLabel = range?.from
    ? range.to && range.to.getTime() !== range.from.getTime()
      ? `${format(range.from, "dd MMM yyyy")} – ${format(range.to, "dd MMM yyyy")}`
      : format(range.from, "dd MMM yyyy")
    : "All dates";

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setRange(p.range());
    setActivePreset(p.label);
  };

  const exportExcel = () => {
    const esc = (v: string | number) =>
      String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const row = (cells: (string | number)[], tag = "td") =>
      `<tr>${cells.map((c) => `<${tag}>${esc(c)}</${tag}>`).join("")}</tr>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head><body>
<table>
${row(["Nethra's Sales Report"], "th")}
${row(["Period", rangeLabel])}
${row(["Status filter", status === "All" ? "All statuses" : status])}
${row(["Revenue", revenue])}
${row(["Orders", filtered.length])}
${row(["Avg order value", Math.round(avgOrderValue)])}
${row(["Orders shipped", shippedCount])}
</table><br />
<table border="1">
${row(["Top products", "Units sold", "Revenue"], "th")}
${topProducts.map((p) => row([p.name, p.units, p.revenue])).join("")}
</table><br />
<table border="1">
${row(["Order", "Date", "Customer", "Payment method", "Payment status", "Status", "Total"], "th")}
${filtered
  .map((o) =>
    row([
      o.OrderNumber,
      format(parseDate(o.CreatedOn), "dd MMM yyyy HH:mm"),
      o.ShippingName,
      o.PaymentMethod,
      o.PaymentStatus,
      o.Status,
      Number(o.Total),
    ]),
  )
  .join("")}
</table></body></html>`;
    const blob = new Blob(["﻿", html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${format(new Date(), "yyyy-MM-dd")}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatusBadge = ({ s }: { s: string }) => (
    <span
      className={`inline-block rounded-sm px-2 py-0.5 text-[11px] font-semibold ${
        STATUS_STYLES[s] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {s}
    </span>
  );

  return (
    <AdminLayout title="Reports" subtitle={subtitle}>
      {/* Filters */}
      <div className="rounded-sm border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-accent">
                <CalendarDays className="h-4 w-4 text-primary" />
                {rangeLabel}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto rounded-sm p-0">
              <div className="flex flex-col sm:flex-row">
                <div className="flex flex-row flex-wrap gap-1 border-b border-border p-2 sm:w-36 sm:flex-col sm:border-b-0 sm:border-r">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        applyPreset(p);
                        if (!p.range()) setPickerOpen(false);
                      }}
                      className={`rounded-sm px-3 py-1.5 text-left text-xs font-semibold ${
                        activePreset === p.label
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  selected={range}
                  onSelect={(r) => {
                    setRange(r);
                    setActivePreset("Custom");
                  }}
                  defaultMonth={range?.from ? range.from : subMonths(new Date(), 1)}
                  disabled={{ after: new Date() }}
                />
              </div>
              <div className="flex items-center justify-between border-t border-border px-3 py-2">
                <span className="text-xs text-muted-foreground">{rangeLabel}</span>
                <button
                  onClick={() => setPickerOpen(false)}
                  className="rounded-sm bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Apply
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring/40"
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All statuses" : s}
              </option>
            ))}
          </select>

          {(range || status !== "All") && (
            <button
              onClick={() => {
                setRange(undefined);
                setActivePreset("All time");
                setStatus("All");
              }}
              className="flex items-center gap-1 rounded-sm px-2 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}

          <button
            onClick={exportExcel}
            className="ml-auto flex items-center gap-2 rounded-sm bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 border-b-2 border-primary">
        {(
          [
            { id: "overview", label: "Overview" },
            { id: "orders", label: `Orders (${filtered.length})` },
          ] as const
        ).map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px rounded-t-sm border border-b-0 px-6 py-2.5 text-sm font-bold transition-colors ${i === 1 ? "ml-auto" : ""} ${
              tab === t.id
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-transparent bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* Summary */}
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Revenue", value: inr(revenue), icon: IndianRupee },
              { label: "Orders", value: String(filtered.length), icon: ShoppingBag },
              { label: "Avg order value", value: inr(Math.round(avgOrderValue)), icon: TrendingUp },
              { label: "Orders shipped", value: String(shippedCount), icon: Truck },
            ].map((s, i) => {
              const t = KPI_TONES[i % KPI_TONES.length]!;
              return (
                <div
                  key={s.label}
                  className={`relative overflow-hidden rounded-sm border p-4 shadow-[var(--shadow-card)] ${t.card}`}
                >
                  <span className={`absolute inset-y-0 left-0 w-1.5 ${t.bar}`} />
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold uppercase tracking-wide ${t.text}`}>
                      {s.label}
                    </p>
                    <span className={`grid h-8 w-8 place-items-center rounded-sm ${t.chip}`}>
                      <s.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className={`mt-2 font-sans text-3xl font-bold ${t.text}`}>{s.value}</p>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-sm border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-bold">{daily ? "Daily revenue" : "Monthly revenue"}</h2>
              {(() => {
                const W = 600;
                const H = 220;
                const padL = 44;
                const padR = 12;
                const padT = 12;
                const padB = 28;
                const innerW = W - padL - padR;
                const innerH = H - padT - padB;
                const x = (i: number) =>
                  padL + (trend.length > 1 ? (i / (trend.length - 1)) * innerW : innerW / 2);
                const y = (v: number) => padT + innerH - (v / max) * innerH;
                const pts = trend.map((t, i) => `${x(i)},${y(t.value)}`);
                const area =
                  trend.length > 0
                    ? `M${x(0)},${padT + innerH} L${pts.join(" L")} L${x(trend.length - 1)},${padT + innerH} Z`
                    : "";
                const step = Math.max(1, Math.ceil(trend.length / 8));
                const compact = (v: number) =>
                  v >= 100000
                    ? `${+(v / 100000).toFixed(1)}L`
                    : v >= 1000
                      ? `${+(v / 1000).toFixed(1)}k`
                      : String(Math.round(v));
                return (
                  <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="mt-4 h-auto w-full"
                    role="img"
                    aria-label={daily ? "Daily revenue chart" : "Monthly revenue chart"}
                  >
                    {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                      <g key={f}>
                        <line
                          x1={padL}
                          x2={W - padR}
                          y1={y(max * f)}
                          y2={y(max * f)}
                          className="stroke-border"
                          strokeDasharray={f === 0 ? undefined : "3 4"}
                        />
                        <text
                          x={padL - 6}
                          y={y(max * f) + 3}
                          textAnchor="end"
                          className="fill-muted-foreground"
                          fontSize="10"
                        >
                          {compact(max * f)}
                        </text>
                      </g>
                    ))}
                    {area && <path d={area} className="fill-primary/10" />}
                    {trend.length > 1 && (
                      <polyline
                        points={pts.join(" ")}
                        fill="none"
                        className="stroke-primary"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}
                    {trend.map((t, i) => (
                      <g key={`${t.label}-${i}`}>
                        <circle
                          cx={x(i)}
                          cy={y(t.value)}
                          r="4"
                          className="fill-card stroke-primary"
                          strokeWidth="2"
                        >
                          <title>{`${t.label}: ${inr(t.value)}`}</title>
                        </circle>
                        {i % step === 0 && (
                          <text
                            x={x(i)}
                            y={H - 8}
                            textAnchor="middle"
                            className="fill-muted-foreground"
                            fontSize="10"
                          >
                            {t.label}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>

            <div className="rounded-sm border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-bold">Sales by category</h2>
              {categorySales.length === 0 ? (
                <p className="mt-4 text-xs text-muted-foreground">No sales in this period.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {categorySales.map((c) => (
                    <li key={c.name}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-muted-foreground">{inr(c.revenue)}</span>
                      </div>
                      <div className="h-2 rounded-sm bg-muted">
                        <div
                          className="h-2 rounded-sm bg-primary"
                          style={{ width: `${(c.revenue / maxCategoryRevenue) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Top products */}
          <div className="mt-4 rounded-sm border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-bold">Top selling products</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Units Sold</th>
                    <th className="pb-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-muted-foreground">
                        No sales in this period.
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((p, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-2.5 font-semibold">{p.name}</td>
                        <td className="py-2.5">{p.units}</td>
                        <td className="py-2.5 text-right font-bold text-primary">
                          {inr(p.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "orders" && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Orders ({filtered.length})</h2>
            <div className="flex overflow-hidden rounded-sm border border-border">
              {(
                [
                  { id: "list", icon: List, label: "List view" },
                  { id: "grid", icon: LayoutGrid, label: "Grid view" },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  aria-label={v.label}
                  title={v.label}
                  onClick={() => setView(v.id)}
                  className={`grid h-9 w-10 place-items-center ${
                    view === v.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  <v.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-sm border border-border bg-card py-10 text-center text-sm text-muted-foreground">
              No orders match the selected filters.
            </div>
          ) : view === "list" ? (
            <div className="overflow-x-auto rounded-sm border border-border bg-card shadow-[var(--shadow-card)]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Order</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Payment</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.Orderkey} className="border-t border-border">
                      <td className="px-4 py-2.5 font-semibold">{o.OrderNumber}</td>
                      <td className="px-4 py-2.5">
                        {format(parseDate(o.CreatedOn), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-2.5">{o.ShippingName}</td>
                      <td className="px-4 py-2.5">
                        {o.PaymentMethod} · {o.PaymentStatus}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge s={o.Status} />
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-primary">
                        {inr(Number(o.Total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((o) => (
                <div
                  key={o.Orderkey}
                  className="rounded-sm border border-border bg-card p-4 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{o.OrderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseDate(o.CreatedOn), "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                    <StatusBadge s={o.Status} />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{o.ShippingName}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.PaymentMethod} · {o.PaymentStatus}
                  </p>
                  <p className="mt-3 font-sans text-2xl font-bold text-primary">
                    {inr(Number(o.Total))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
