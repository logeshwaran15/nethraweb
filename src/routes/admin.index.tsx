import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IndianRupee, Package, ShoppingBag, TrendingUp, AlertTriangle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/lib/admin-store";
import { apiGet } from "@/lib/api";
import { inr } from "@/lib/mock-data";

type OrderRow = {
  Orderkey: string;
  OrderNumber: string;
  Status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  Total: string | number;
  CreatedOn: string;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const KPI_TONES = [
  {
    card: "border-emerald-200 from-emerald-50 to-white",
    bar: "bg-emerald-500",
    text: "text-emerald-700",
    chip: "from-emerald-400 to-emerald-600 text-white",
  },
  {
    card: "border-sky-200 from-sky-50 to-white",
    bar: "bg-sky-500",
    text: "text-sky-700",
    chip: "from-sky-400 to-blue-600 text-white",
  },
  {
    card: "border-violet-200 from-violet-50 to-white",
    bar: "bg-violet-500",
    text: "text-violet-700",
    chip: "from-violet-400 to-purple-600 text-white",
  },
  {
    card: "border-rose-200 from-rose-50 to-white",
    bar: "bg-rose-500",
    text: "text-rose-700",
    chip: "from-amber-400 to-rose-500 text-white",
  },
];

export default function AdminDashboard() {
  const { products, categories } = useAdmin();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    apiGet<OrderRow[]>("/api/orders.php")
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  const revenue = useMemo(() => (orders ?? []).reduce((s, o) => s + Number(o.Total), 0), [orders]);
  const pending = (orders ?? []).filter((o) => o.Status === "Processing").length;
  const lowStock = products.filter((p) => p.stock <= 8);

  // Last 7 calendar days ending today, oldest first.
  const salesByDay = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return {
        key: d.toDateString(),
        day: i === 6 ? "Today" : `${DAY_LABELS[d.getDay()]} ${d.getDate()}`,
        value: 0,
        orders: 0,
      };
    });
    for (const o of orders ?? []) {
      const created = new Date(o.CreatedOn.replace(" ", "T"));
      const slot = days.find((d) => d.key === created.toDateString());
      if (slot) {
        slot.value += Number(o.Total);
        slot.orders += 1;
      }
    }
    return days;
  }, [orders]);

  const loading = orders === null;
  const weekTotal = salesByDay.reduce((s, d) => s + d.value, 0);
  const weekOrders = salesByDay.reduce((s, d) => s + d.orders, 0);

  const stats = [
    {
      label: "Revenue",
      value: loading ? "…" : inr(revenue),
      icon: IndianRupee,
      note: `${orders?.length ?? 0} orders total`,
    },
    {
      label: "Orders",
      value: loading ? "…" : String(orders?.length ?? 0),
      icon: ShoppingBag,
      note: `${pending} pending`,
    },
    {
      label: "Products",
      value: String(products.length),
      icon: Package,
      note: `${categories.length} categories`,
    },
    {
      label: "Low Stock",
      value: String(lowStock.length),
      icon: AlertTriangle,
      note: "items at ≤8 units",
    },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your store performance">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => {
          const t = KPI_TONES[i % KPI_TONES.length]!;
          return (
            <div
              key={s.label}
              className={`group relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${t.card}`}
            >
              <span
                className={`pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full opacity-20 ${t.bar}`}
              />
              <div className="relative flex items-center gap-3">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br shadow-sm ${t.chip}`}
                >
                  <s.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold uppercase tracking-wide ${t.text}`}>
                    {s.label}
                  </p>
                  <p className="truncate font-sans text-3xl font-extrabold leading-tight text-[#2D2525]">
                    {s.value}
                  </p>
                </div>
              </div>
              <p className="relative mt-2 truncate text-[11px] font-medium text-muted-foreground">
                {s.note}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Sales this week</h2>
              <p className="text-[11px] text-muted-foreground">Revenue over the last 7 days</p>
            </div>
            {!loading && (
              <div className="text-right">
                <p className="font-sans text-xl font-extrabold leading-tight text-primary">
                  {inr(weekTotal)}
                </p>
                <p className="text-[11px] text-muted-foreground">{weekOrders} orders</p>
              </div>
            )}
          </div>
          {loading ? (
            <p className="mt-5 text-xs text-muted-foreground">Loading…</p>
          ) : weekTotal === 0 ? (
            <p className="mt-5 text-xs text-muted-foreground">No sales in the last 7 days.</p>
          ) : (
            <div className="mt-4 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    width={44}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(v: number) => (v >= 1000 ? `₹${v / 1000}k` : `₹${v}`)}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--primary)", strokeDasharray: "3 3" }}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number, _n, p) => [
                      `${inr(v)} · ${p.payload.orders} order(s)`,
                      "Sales",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#salesFill)"
                    dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-sm border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Low stock</h2>
          </div>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-sm bg-muted/60 p-2">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="h-9 w-9 rounded-sm object-cover"
                />
                <span className="line-clamp-1 flex-1 text-xs font-semibold">{p.name}</span>
                <span className="text-xs font-bold text-primary">{p.stock}</span>
              </li>
            ))}
            {lowStock.length === 0 && (
              <li className="text-xs text-muted-foreground">All products well stocked.</li>
            )}
          </ul>
          <Link
            to="/admin/products"
            className="mt-3 block rounded-full border border-primary py-2 text-center text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Manage products
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
