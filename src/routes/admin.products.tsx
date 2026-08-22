import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin, type AdminProduct } from "@/lib/admin-store";
import { uploadImage } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { inr } from "@/lib/mock-data";

const emptyProduct: AdminProduct = {
  id: "",
  name: "",
  price: 0,
  mrp: 0,
  image: "",
  category: "",
  group: "stencils",
  rating: 4.5,
  reviews: 0,
  tagline: "",
  bullets: [],
  stock: 0,
  active: true,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const PAGE_SIZE = 8;

const useSelection = (ids: string[]) => {
  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
  const toggleAll = () =>
    setSelected(allSelected ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])]);
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clear = () => setSelected([]);
  return { selected, allSelected, toggleAll, toggleOne, clear };
};

export default function AdminProducts() {
  const { products, categories, saveProduct, deleteProduct } = useAdmin();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"all" | "stencils" | "accessories">("all");
  const [editing, setEditing] = useState<{ draft: AdminProduct; originalId?: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);

  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          (group === "all" || p.group === group) &&
          p.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, query, group],
  );

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, group]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paged = useMemo(
    () => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [list, page],
  );

  const { selected, allSelected, toggleAll, toggleOne, clear } = useSelection(paged.map((p) => p.id));

  const submit = () => {
    if (!editing) return;
    const draft = { ...editing.draft };
    if (!draft.name.trim()) return;
    if (!draft.id) draft.id = slugify(draft.name);
    if (!draft.mrp) draft.mrp = draft.price;
    saveProduct(draft, editing.originalId);
    setEditing(null);
  };

  const deleteSelected = async () => {
    await Promise.all(selected.map((id) => deleteProduct(id)));
    clear();
  };

  return (
    <AdminLayout
      title="Products"
      subtitle={`${products.length} products in catalogue`}
      actions={
        <button
          onClick={() => {
            setImagePreview(null);
            setEditing({ draft: { ...emptyProduct } });
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          {(["all", "stencils", "accessories"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold capitalize ${
                group === g
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-2.5">
          <span className="text-xs font-semibold text-muted-foreground">{selected.length} selected</span>
          <button
            onClick={deleteSelected}
            className="flex items-center gap-1.5 rounded-full border border-destructive px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Selected
          </button>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.id} className="border-t border-border align-middle">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleOne(p.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-[10px] text-muted-foreground">
                          IMG
                        </span>
                      )}
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                  <td className="px-4 py-3 font-bold text-primary">{inr(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        p.stock === 0
                          ? "bg-destructive/10 text-destructive"
                          : p.stock <= 8
                            ? "bg-gold-soft text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                      {p.active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        aria-label={`Edit ${p.name}`}
                        onClick={() => {
                          setImagePreview(p.image || null);
                          setEditing({ draft: { ...p }, originalId: p.id });
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary hover:bg-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Delete ${p.name}`}
                        onClick={() => deleteProduct(p.id)}
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
                    No products match your search.
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
                {editing.originalId ? "Edit Product" : "Add Product"}
              </h2>
              <button aria-label="Close" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Name">
                <input
                  className={inputCls}
                  value={editing.draft.name}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, name: e.target.value } })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (₹)">
                  <input
                    type="number"
                    className={inputCls}
                    value={editing.draft.price}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, price: Number(e.target.value) },
                      })
                    }
                  />
                </Field>
                <Field label="MRP (₹)">
                  <input
                    type="number"
                    className={inputCls}
                    value={editing.draft.mrp}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, mrp: Number(e.target.value) },
                      })
                    }
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select
                    className={inputCls}
                    value={editing.draft.category}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, category: e.target.value },
                      })
                    }
                  >
                    <option value="">Select</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Stock">
                  <input
                    type="number"
                    className={inputCls}
                    value={editing.draft.stock}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, stock: Number(e.target.value) },
                      })
                    }
                  />
                </Field>
              </div>
              <Field label="Group">
                <select
                  className={inputCls}
                  value={editing.draft.group}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      draft: {
                        ...editing.draft,
                        group: e.target.value as AdminProduct["group"],
                      },
                    })
                  }
                >
                  <option value="stencils">Stencils</option>
                  <option value="accessories">Accessories</option>
                </select>
              </Field>
              <Field label="Product Image">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImagePreview(URL.createObjectURL(file));
                    setUploading(true);
                    try {
                      const url = await uploadImage(file);
                      setEditing((cur) => (cur ? { ...cur, draft: { ...cur.draft, image: url } } : cur));
                    } catch (err) {
                      showToast(err instanceof Error ? err.message : "Image upload failed", "error");
                    } finally {
                      setUploading(false);
                    }
                  }}
                  className={`${inputCls} py-1.5`}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="mt-2 h-28 w-28 rounded-xl border border-border object-cover"
                  />
                )}
                {uploading && <p className="mt-1 text-[11px] text-muted-foreground">Uploading…</p>}
              </Field>
              <Field label="Tagline">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={editing.draft.tagline}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, tagline: e.target.value } })
                  }
                />
              </Field>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={editing.draft.active}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, active: e.target.checked } })
                  }
                />
                Active in storefront
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
                disabled={uploading}
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {uploading ? "Uploading image…" : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
