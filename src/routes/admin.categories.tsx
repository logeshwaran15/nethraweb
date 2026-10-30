import { useEffect, useMemo, useState } from "react";
import { useSearchQuery } from "@/components/admin/useSearchQuery";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { PageSizeSelect } from "@/components/admin/PageSizeSelect";
import { Req } from "@/components/admin/Req";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin, type AdminCategory } from "@/lib/admin-store";
import { uploadImage } from "@/lib/api";
import { showToast } from "@/lib/toast";

const emptyCategory: AdminCategory = {
  slug: "",
  name: "",
  image: "",
  group: "stencils",
  sortOrder: 0,
  active: true,
  dbKey: "",
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";

export default function AdminCategories() {
  const { categories, products, saveCategory, deleteCategory } = useAdmin();
  const [editing, setEditing] = useState<{
    draft: AdminCategory;
    originalSlug?: string;
  } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useSearchQuery();

  const filtered = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [categories, query],
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const submit = async () => {
    if (!editing || !editing.draft.name.trim()) return;
    const draft = { ...editing.draft };
    if (!draft.slug) draft.slug = slugify(draft.name);
    if ((await saveCategory(draft, editing.originalSlug)) === false) return;
    setEditing(null);
  };

  return (
    <AdminLayout
      title="Categories"
      subtitle={`${categories.length} categories`}
      actions={
        <button
          onClick={() => {
            setImagePreview(null);
            setEditing({ draft: { ...emptyCategory } });
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      }
    >
      <div className="relative mb-3 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories"
          className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="overflow-hidden rounded-sm border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => {
                const count = products.filter((p) => p.category === c.slug).length;
                return (
                  <tr key={c.slug} className="border-t border-border align-middle">
                    <td className="px-4 py-3 font-semibold text-muted-foreground">
                      {c.sortOrder > 0 ? c.sortOrder : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.image ? (
                          <img
                            src={c.image}
                            alt={c.name}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-[9px] text-muted-foreground">
                            IMG
                          </span>
                        )}
                        <span className="font-semibold">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{c.group}</td>
                    <td className="px-4 py-3 text-muted-foreground">{count}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                        {c.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Edit ${c.name}`}
                          onClick={() => {
                            setImagePreview(c.image || null);
                            setEditing({ draft: { ...c }, originalSlug: c.slug });
                          }}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary hover:bg-accent"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          aria-label={`Delete ${c.name}`}
                          onClick={() => deleteCategory(c.slug)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {categories.length === 0
                      ? "No categories yet."
                      : `No categories match "${query}".`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filtered.length)} of {filtered.length}
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
          <div className="relative w-full rounded-t-sm bg-card p-5 sm:max-w-md sm:rounded-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-xl text-primary">
                {editing.originalSlug ? "Edit Category" : "Add Category"}
              </h2>
              <button aria-label="Close" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Name
                  <Req />
                </span>
                <input
                  className={inputCls}
                  placeholder="Enter category name"
                  value={editing.draft.name}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, name: e.target.value } })
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Slug (auto if blank)
                </span>
                <input
                  className={inputCls}
                  placeholder="e.g. mehandi-cones"
                  value={editing.draft.slug}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, slug: e.target.value } })
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Group
                </span>
                <select
                  className={inputCls}
                  value={editing.draft.group}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      draft: {
                        ...editing.draft,
                        group: e.target.value as AdminCategory["group"],
                      },
                    })
                  }
                >
                  <option value="stencils">Stencils</option>
                  <option value="accessories">Accessories</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Display Order (1 = first)
                </span>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  placeholder="e.g. 1"
                  value={editing.draft.sortOrder || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, sortOrder: Math.max(0, Number(e.target.value) || 0) },
                    })
                  }
                />
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Enter 1, 2, 3… to choose where this category appears on the home page. Leave blank
                  to show it after the numbered ones (A-Z).
                </span>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Category Image
                </span>
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
                      setEditing((cur) =>
                        cur ? { ...cur, draft: { ...cur.draft, image: url } } : cur,
                      );
                    } catch (err) {
                      showToast(
                        err instanceof Error ? err.message : "Image upload failed",
                        "error",
                      );
                    } finally {
                      setUploading(false);
                    }
                  }}
                  className={`${inputCls} py-1.5`}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Category preview"
                    className="mt-2 h-28 w-28 rounded-xl border border-border object-cover"
                  />
                )}
                {uploading && <p className="mt-1 text-[11px] text-muted-foreground">Uploading…</p>}
              </label>
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
                {uploading ? "Uploading image…" : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
