import { useEffect, useMemo, useState } from "react";
import { useSearchQuery } from "@/components/admin/useSearchQuery";
import { PageSizeSelect } from "@/components/admin/PageSizeSelect";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { parseCsvObjects } from "@/lib/csv";
import { Req } from "@/components/admin/Req";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin, type AdminProduct } from "@/lib/admin-store";
import { uploadImage } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { confirmAction } from "@/lib/confirm";
import { inr } from "@/lib/mock-data";

const emptyProduct: AdminProduct = {
  id: "",
  name: "",
  price: 0,
  mrp: 0,
  image: "",
  images: [],
  category: "",
  group: "stencils",
  rating: 4.5,
  reviews: 0,
  tagline: "",
  bullets: [],
  stock: 0,
  variants: [],
  active: true,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const MAX_IMAGES = 5;

type ImportRow = { product: AdminProduct; error: string | null };

const CSV_TEMPLATE = [
  "Name,Price,Mrp,Category,Group,Stock,Tagline,Description,ImageURLs",
  "Sample Mehandi Stencil,199,299,arabic-stencils,stencils,20,Premium stencil,Line 1|Line 2,https://example.com/img1.jpg|https://example.com/img2.jpg",
].join("\n");

function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function rowToImportRow(row: Record<string, string>): ImportRow {
  const name = row["Name"]?.trim() ?? "";
  const price = Number(row["Price"] || 0);
  const images = (row["ImageURLs"] || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGES);

  let error: string | null = null;
  if (!name) error = "Missing Name";
  else if (!price) error = "Missing/invalid Price";
  else if (images.length === 0) error = "Missing ImageURLs (at least 1)";

  const group: AdminProduct["group"] =
    row["Group"]?.trim() === "accessories" ? "accessories" : "stencils";

  return {
    product: {
      id: "",
      name,
      price,
      mrp: Number(row["Mrp"] || price),
      image: images[0] ?? "",
      images,
      category: row["Category"]?.trim() ?? "",
      group,
      rating: 4.5,
      reviews: 0,
      tagline: row["Tagline"]?.trim() ?? "",
      bullets: (row["Description"] || "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
      stock: Number(row["Stock"] || 0),
      variants: [],
      active: true,
    },
    error,
  };
}

const useSelection = (ids: string[]) => {
  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
  const toggleAll = () =>
    setSelected(
      allSelected
        ? selected.filter((id) => !ids.includes(id))
        : [...new Set([...selected, ...ids])],
    );
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clear = () => setSelected([]);
  return { selected, allSelected, toggleAll, toggleOne, clear };
};

export default function AdminProducts() {
  const { products, categories, saveProduct, deleteProduct } = useAdmin();
  const [query, setQuery] = useSearchQuery();
  const [group, setGroup] = useState<"all" | "stencils" | "accessories">("all");
  const [editing, setEditing] = useState<{ draft: AdminProduct; originalId?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          (group === "all" || p.group === group) &&
          p.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, query, group],
  );

  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query, group]);

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

  const { selected, allSelected, toggleAll, toggleOne, clear } = useSelection(
    paged.map((p) => p.id),
  );
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(0);

  const parseFile = async (file: File) => {
    const text = await file.text();
    const objs = parseCsvObjects(text);
    setImportRows(objs.map(rowToImportRow));
    setImportDone(0);
  };

  const runImport = async () => {
    setImporting(true);
    let done = 0;
    for (const row of importRows) {
      if (row.error) continue;
      try {
        await saveProduct(row.product, undefined, { silent: true });
      } catch (err) {
        row.error = err instanceof Error ? err.message : "Import failed";
      }
      done++;
      setImportDone(done);
      setImportRows((rows) => [...rows]);
    }
    setImporting(false);
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportRows([]);
    setImportDone(0);
  };

  const submit = async () => {
    if (!editing) return;
    const draft = { ...editing.draft };
    if (!draft.name.trim()) return;
    if (draft.images.length < 1) {
      showToast("Please upload at least 1 product image", "error");
      return;
    }
    draft.image = draft.images[0] ?? "";
    if (!draft.id) draft.id = slugify(draft.name);
    if (draft.variants.length) {
      // Shop price/stock follow the options: lowest price, total stock.
      draft.variants = draft.variants.filter((v) => v.label.trim());
      if (draft.variants.some((v) => v.price <= 0)) {
        showToast("Every option needs a price", "error");
        return;
      }
      const cheapest = draft.variants.reduce((a, b) => (b.price < a.price ? b : a));
      draft.price = cheapest.price;
      draft.mrp = cheapest.mrp || cheapest.price;
      draft.stock = draft.variants.reduce((t, v) => t + v.stock, 0);
    }
    if (!draft.mrp) draft.mrp = draft.price;
    if ((await saveProduct(draft, editing.originalId)) === false) return;
    setEditing(null);
  };

  const deleteSelected = async () => {
    if (!(await confirmAction({ title: "Delete products?", message: `Delete ${selected.length} selected product(s)? This cannot be undone.`, confirmText: "Delete", variant: "danger" }))) return;
    try {
      await Promise.all(selected.map((id) => deleteProduct(id, { silent: true })));
      showToast(`${selected.length} product(s) deleted successfully`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete products", "error");
    }
    clear();
  };

  return (
    <AdminLayout
      title="Products"
      subtitle={`${products.length} products in catalogue`}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary"
          >
            <Upload className="h-4 w-4" /> Import
          </button>
          <button
            onClick={() => {
              setEditing({ draft: { ...emptyProduct } });
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
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
        <div className="mt-3 flex items-center justify-between rounded-sm border border-border bg-card px-4 py-2.5">
          <span className="text-xs font-semibold text-muted-foreground">
            {selected.length} selected
          </span>
          <button
            onClick={deleteSelected}
            className="flex items-center gap-1.5 rounded-full border border-destructive px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Selected
          </button>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-sm border border-border bg-card shadow-[var(--shadow-card)]">
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setEditing(null)} />
          <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-sm bg-card p-5 sm:max-w-lg sm:rounded-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-xl text-primary">
                {editing.originalId ? "Edit Product" : "Add Product"}
              </h2>
              <button aria-label="Close" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Name" required>
                <input
                  className={inputCls}
                  placeholder="Enter product name"
                  value={editing.draft.name}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, name: e.target.value } })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (₹)" required>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="Enter price"
                    disabled={editing.draft.variants.length > 0}
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
                    placeholder="Enter MRP"
                    disabled={editing.draft.variants.length > 0}
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
                    placeholder="Enter stock quantity"
                    disabled={editing.draft.variants.length > 0}
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
              <div className="rounded-xl border border-dashed border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Options (optional)</p>
                    <p className="text-xs text-muted-foreground">
                      For products sold in numbered/colour options, each with its own price and
                      stock. When added, the price and stock above are taken from the options.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        draft: {
                          ...editing.draft,
                          variants: [
                            ...editing.draft.variants,
                            {
                              label: String(editing.draft.variants.length + 1),
                              price: editing.draft.price || 0,
                              mrp: editing.draft.mrp || 0,
                              stock: 0,
                            },
                          ],
                        },
                      })
                    }
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add option
                  </button>
                </div>
                {editing.draft.variants.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 text-[11px] font-semibold uppercase text-muted-foreground">
                      <span>Option</span>
                      <span>Price ₹</span>
                      <span>MRP ₹</span>
                      <span>Stock</span>
                      <span className="w-8" />
                    </div>
                    {editing.draft.variants.map((v, i) => {
                      const update = (patch: Partial<typeof v>) =>
                        setEditing({
                          ...editing,
                          draft: {
                            ...editing.draft,
                            variants: editing.draft.variants.map((x, j) =>
                              j === i ? { ...x, ...patch } : x,
                            ),
                          },
                        });
                      return (
                        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
                          <input
                            className={inputCls}
                            value={v.label}
                            placeholder="e.g. 1"
                            onChange={(e) => update({ label: e.target.value })}
                          />
                          <input
                            type="number"
                            className={inputCls}
                            value={v.price}
                            onChange={(e) => update({ price: Number(e.target.value) })}
                          />
                          <input
                            type="number"
                            className={inputCls}
                            value={v.mrp}
                            onChange={(e) => update({ mrp: Number(e.target.value) })}
                          />
                          <input
                            type="number"
                            className={inputCls}
                            value={v.stock}
                            onChange={(e) => update({ stock: Number(e.target.value) })}
                          />
                          <button
                            type="button"
                            aria-label="Remove option"
                            onClick={() =>
                              setEditing({
                                ...editing,
                                draft: {
                                  ...editing.draft,
                                  variants: editing.draft.variants.filter((_, j) => j !== i),
                                },
                              })
                            }
                            className="grid h-10 w-8 place-items-center text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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
              <Field label={`Product Images (${editing.draft.images.length}/${MAX_IMAGES}, min 1)`} required>
                <div className="flex flex-wrap gap-2">
                  {editing.draft.images.map((url, i) => (
                    <div key={url + i} className="relative h-20 w-20">
                      <img
                        src={url}
                        alt={`Product image ${i + 1}`}
                        className="h-full w-full rounded-xl border border-border object-cover"
                      />
                      {i === 0 ? (
                        <span className="absolute bottom-1 left-1 rounded bg-foreground/70 px-1 text-[9px] text-background">
                          Thumbnail
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setEditing((cur) =>
                              cur
                                ? {
                                    ...cur,
                                    draft: {
                                      ...cur.draft,
                                      images: [
                                        url,
                                        ...cur.draft.images.filter((_, idx) => idx !== i),
                                      ],
                                    },
                                  }
                                : cur,
                            )
                          }
                          className="absolute bottom-1 left-1 rounded bg-card/90 px-1 text-[9px] text-foreground"
                        >
                          Set thumbnail
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() =>
                          setEditing((cur) =>
                            cur
                              ? {
                                  ...cur,
                                  draft: {
                                    ...cur.draft,
                                    images: cur.draft.images.filter((_, idx) => idx !== i),
                                  },
                                }
                              : cur,
                          )
                        }
                        className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-destructive text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {editing.draft.images.length < MAX_IMAGES && (
                    <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border border-dashed border-border text-muted-foreground hover:bg-accent">
                      <Plus className="h-5 w-5" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files ?? []);
                          e.target.value = "";
                          if (!files.length) return;
                          const room = MAX_IMAGES - (editing?.draft.images.length ?? 0);
                          setUploading(true);
                          try {
                            for (const file of files.slice(0, room)) {
                              const url = await uploadImage(file);
                              setEditing((cur) =>
                                cur
                                  ? {
                                      ...cur,
                                      draft: { ...cur.draft, images: [...cur.draft.images, url] },
                                    }
                                  : cur,
                              );
                            }
                          } catch (err) {
                            showToast(
                              err instanceof Error ? err.message : "Image upload failed",
                              "error",
                            );
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
                {uploading && <p className="mt-1 text-[11px] text-muted-foreground">Uploading…</p>}
              </Field>
              <Field label="Tagline">
                <textarea
                  rows={2}
                  className={inputCls}
                  placeholder="Enter a short tagline"
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
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, active: e.target.checked },
                    })
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

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={closeImport} />
          <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-sm bg-card p-5 sm:max-w-lg sm:rounded-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-xl text-primary">Bulk Import Products</h2>
              <button aria-label="Close" onClick={closeImport}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {importRows.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV with columns:{" "}
                  <code>
                    Name, Price, Mrp, Category, Group, Stock, Tagline, Description, ImageURLs
                  </code>
                  . Separate multiple description lines or image URLs with <code>|</code>. Category
                  must match an existing category slug.
                </p>
                <button
                  onClick={downloadCsvTemplate}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary underline"
                >
                  <Download className="h-3.5 w-3.5" /> Download CSV template
                </button>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-sm border border-dashed border-border p-8 text-center text-sm text-muted-foreground hover:bg-accent">
                  <Upload className="h-6 w-6" />
                  Choose CSV file
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) parseFile(file);
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {importRows.length} row{importRows.length === 1 ? "" : "s"} found —{" "}
                  {importRows.filter((r) => r.error).length} with errors will be skipped.
                </p>
                <ul className="max-h-64 space-y-1.5 overflow-y-auto rounded-sm border border-border p-2">
                  {importRows.map((r, i) => (
                    <li
                      key={i}
                      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs ${
                        r.error ? "bg-destructive/10 text-destructive" : "bg-secondary/50"
                      }`}
                    >
                      <span className="truncate font-medium">
                        {r.product.name || `Row ${i + 1}`}
                      </span>
                      <span className="shrink-0">{r.error ?? "Ready"}</span>
                    </li>
                  ))}
                </ul>
                {importing && (
                  <p className="text-xs font-semibold text-primary">
                    Importing {importDone}/{importRows.length}…
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={closeImport}
                    disabled={importing}
                    className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await runImport();
                      showToast("Import finished", "success");
                    }}
                    disabled={importing || importRows.every((r) => r.error)}
                    className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {importing
                      ? "Importing…"
                      : `Import ${importRows.filter((r) => !r.error).length} Products`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label}
        {required && <Req />}
      </span>
      {children}
    </label>
  );
}
