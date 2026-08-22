import { createFileRoute, Link } from "@tanstack/react-router";
import { IndianRupee, Package, ShoppingBag, TrendingUp, AlertTriangle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/lib/admin-store";
import { inr, mockOrders } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nethra's Admin" },
      { name: "description", content: "Sales, orders and inventory overview for Nethra's." },
      { property: "og:title", content: "Dashboard — Nethra's Admin" },
      { property: "og:description", content: "Sales, orders and inventory overview." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

const salesByDay = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 68 },
  { day: "Wed", value: 55 },
  { day: "Thu", value: 82 },
  { day: "Fri", value: 96 },
  { day: "Sat", value: 74 },
  { day: "Sun", value: 61 },
];

function AdminDashboard() {
  const { products, categories } = useAdmin();
  const revenue = mockOrders.reduce((s, o) => s + o.total, 0);
  const lowStock = products.filter((p) => p.stock <= 8);

  const stats = [
    { label: "Revenue", value: inr(revenue), icon: IndianRupee, note: "+12.4% this week" },
    { label: "Orders", value: String(mockOrders.length), icon: ShoppingBag, note: "2 pending" },
    { label: "Products", value: String(products.length), icon: Package, note: `${categories.length} categories` },
    { label: "Conversion", value: "3.8%", icon: TrendingUp, note: "+0.6% vs last week" },
  ];

  const max = Math.max(...salesByDay.map((d) => d.value));

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your store performance">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-2xl text-primary">{s.value}</p>
            <p className="mt-1 text-[11px] text-success">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="text-sm font-bold">Sales this week</h2>
          <div className="mt-5 flex h-44 items-end gap-3">
            {salesByDay.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-primary/85"
                  style={{ height: `${(d.value / max) * 100}%` }}
                />
                <span className="text-[11px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Low stock</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-xl bg-muted/60 p-2">
                <img src={p.image} alt={p.name} className="h-9 w-9 rounded-lg object-cover" />
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

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-bold">Recent orders</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="pb-2">Order</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Items</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="py-2.5 font-semibold">{o.id}</td>
                  <td className="py-2.5 text-muted-foreground">{o.date}</td>
                  <td className="py-2.5 text-muted-foreground">{o.items.length}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-bold text-primary">{inr(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
