import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin, type Coupon } from "@/lib/admin-store";

const emptyCoupon: Coupon = {
  code: "",
  type: "percent",
  value: 0,
  minOrder: 0,
  expiry: "",
  usageLimit: 100,
  usageCount: 0,
  active: true,
  dbKey: "",
};

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";
const labelCls = "mb-1 block text-xs font-semibold text-muted-foreground";

const formatExpiry = (isoDate: string) => {
  if (!isoDate) return "—";
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const PAGE_SIZE = 8;

export default function AdminCoupons() {
  const { coupons, saveCoupon, deleteCoupon } = useAdmin();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ draft: Coupon; originalCode?: string } | null>(null);

  const list = useMemo(
    () => coupons.filter((c) => c.code.toLowerCase().includes(query.toLowerCase())),
    [coupons, query],
  );

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paged = useMemo(() => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [list, page]);

  const submit = () => {
    if (!editing) return;
    const draft = { ...editing.draft, code: editing.draft.code.trim().toUpperCase() };
    if (!draft.code) return;
    saveCoupon(draft, editing.originalCode);
    setEditing(null);
  };

  return (
    <AdminLayout
      title="Coupons"
      subtitle={`${coupons.length} coupons created`}
      actions={
        <button
          onClick={() => setEditing({ draft: { ...emptyCoupon } })}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
        >
          <Plus className="h-4 w-4" /> Add Coupon
        </button>
      }
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search coupon code"
          className="w-full max-w-sm rounded-full border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => (
                <tr key={c.code} className="border-t border-border align-middle">
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.type === "percent" ? `${c.value}%` : `₹${c.value}`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">₹{c.minOrder}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatExpiry(c.expiry)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.usageCount}/{c.usageLimit}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        c.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        aria-label={`Edit ${c.code}`}
                        onClick={() => setEditing({ draft: { ...c }, originalCode: c.code })}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary hover:bg-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Delete ${c.code}`}
                        onClick={() => deleteCoupon(c.code)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No coupons match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing {list.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, list.length)} of {list.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold">
              Page {page} of {pageCount}
            </span>
            <button
              aria-label="Next page"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setEditing(null)} />
          <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 sm:max-w-lg sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-primary">
                {editing.originalCode ? "Edit Coupon" : "Add Coupon"}
              </h2>
              <button aria-label="Close" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className={labelCls}>Coupon Code</span>
                <input
                  className={`${inputCls} font-mono uppercase`}
                  placeholder="Enter coupon code"
                  value={editing.draft.code}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, code: e.target.value } })
                  }
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Discount Type</span>
                  <select
                    className={inputCls}
                    value={editing.draft.type}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, type: e.target.value as Coupon["type"] },
                      })
                    }
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>Value</span>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="Enter discount value"
                    value={editing.draft.value}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, value: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Minimum Order (₹)</span>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="Enter minimum order"
                    value={editing.draft.minOrder}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, minOrder: Number(e.target.value) },
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Usage Limit</span>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="Enter usage limit"
                    value={editing.draft.usageLimit}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, usageLimit: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              </div>
              <label className="block">
                <span className={labelCls}>Expiry Date</span>
                <input
                  type="date"
                  className={inputCls}
                  value={editing.draft.expiry}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, expiry: e.target.value } })
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={editing.draft.active}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, active: e.target.checked } })
                  }
                />
                Active for customers
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Save Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
