import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/lib/admin-store";
import { inr, mockOrders } from "@/lib/mock-data";

const monthly = [
  { month: "Jan", value: 12400 },
  { month: "Feb", value: 15800 },
  { month: "Mar", value: 14100 },
  { month: "Apr", value: 19200 },
  { month: "May", value: 24600 },
  { month: "Jun", value: 21800 },
];

export default function AdminReports() {
  const { products, categories } = useAdmin();
  const max = Math.max(...monthly.map((m) => m.value));
  const top = [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 5);
  const revenue = monthly.reduce((s, m) => s + m.value, 0);

  return (
    <AdminLayout title="Reports" subtitle="Sales performance and catalogue insights">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Revenue (6 mo)", value: inr(revenue) },
          { label: "Avg order value", value: inr(Math.round(revenue / 420)) },
          { label: "Orders shipped", value: String(mockOrders.length * 37) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-bold">Monthly revenue</h2>
          <div className="mt-5 flex h-48 items-end gap-3">
            {monthly.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{Math.round(m.value / 1000)}k</span>
                <div
                  className="w-full rounded-t-lg bg-primary/85"
                  style={{ height: `${(m.value / max) * 100}%` }}
                />
                <span className="text-[11px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-bold">Sales by category</h2>
          <ul className="mt-4 space-y-3">
            {categories.map((c, i) => {
              const pct = [82, 68, 54, 46, 38, 24][i % 6] ?? 30;
              return (
                <li key={c.slug}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-bold">Top selling products</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="pb-2">Product</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Units</th>
                <th className="pb-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {top.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-2.5 font-semibold">{p.name}</td>
                  <td className="py-2.5 text-muted-foreground">{p.category}</td>
                  <td className="py-2.5">{p.reviews}</td>
                  <td className="py-2.5 text-right font-bold text-primary">
                    {inr(p.reviews * p.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
