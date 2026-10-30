import { useEffect, useMemo, useState } from "react";
import { useSearchQuery } from "@/components/admin/useSearchQuery";
import { PageSizeSelect } from "@/components/admin/PageSizeSelect";
import {
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Minus,
  Package,
  PackageX,
  Plus,
  Search,
} from "lucide-react";
import { KpiCard } from "@/components/admin/KpiCard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/lib/admin-store";

const filters = ["All", "Low Stock", "Out of Stock"] as const;
const LOW_STOCK_THRESHOLD = 10;

export default function AdminInventory() {
  const { products, saveProduct } = useAdmin();
  const [query, setQuery] = useSearchQuery();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const list = useMemo(
    () =>
      products.filter((p) => {
        if (!p.name.toLowerCase().includes(query.toLowerCase())) return false;
        if (filter === "Low Stock") return p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD;
        if (filter === "Out of Stock") return p.stock === 0;
        return true;
      }),
    [products, query, filter],
  );

  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD,
  ).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query, filter]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const paged = useMemo(
    () => list.slice((page - 1) * pageSize, page * pageSize),
    [list, page, pageSize],
  );

  const adjustStock = (id: string, delta: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    void saveProduct({ ...product, stock: Math.max(0, product.stock + delta) }, product.id, {
      silent: true,
    });
  };

  return (
    <AdminLayout title="Inventory" subtitle={`${products.length} products tracked`}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total Stock"
          value={String(products.reduce((s, p) => s + p.stock, 0))}
          note="units across all products"
          icon={Boxes}
          color="emerald"
          active={filter === "All"}
          onClick={() => setFilter("All")}
        />
        <KpiCard
          label="Products"
          value={String(products.length)}
          note="tracked in inventory"
          icon={Package}
          color="sky"
        />
        <KpiCard
          label="Low Stock"
          value={String(lowStockCount)}
          note={`1–${LOW_STOCK_THRESHOLD} units left`}
          icon={AlertTriangle}
          color="amber"
          active={filter === "Low Stock"}
          onClick={() => setFilter(filter === "Low Stock" ? "All" : "Low Stock")}
        />
        <KpiCard
          label="Out of Stock"
          value={String(outOfStockCount)}
          note="needs restocking"
          icon={PackageX}
          color="red"
          active={filter === "Out of Stock"}
          onClick={() => setFilter(filter === "Out of Stock" ? "All" : "Out of Stock")}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-sm border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3 text-right">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.id} className="border-t border-border align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-[10px] text-muted-foreground">
                          IMG
                        </span>
                      )}
                      <p className="font-semibold">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        p.stock === 0
                          ? "bg-destructive/10 text-destructive"
                          : p.stock <= LOW_STOCK_THRESHOLD
                            ? "bg-gold-soft text-primary"
                            : "bg-success/15 text-success"
                      }`}
                    >
                      {p.stock <= LOW_STOCK_THRESHOLD && p.stock > 0 && (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {p.stock} in stock
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        aria-label={`Decrease stock for ${p.name}`}
                        onClick={() => adjustStock(p.id, -1)}
                        disabled={p.stock === 0}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{p.stock}</span>
                      <button
                        aria-label={`Increase stock for ${p.name}`}
                        onClick={() => adjustStock(p.id, 1)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No products match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing {list.length === 0 ? 0 : (page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, list.length)} of {list.length}
          </p>
          <PageSizeSelect value={pageSize} onChange={setPageSize} />
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
    </AdminLayout>
  );
}
