import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin, type AdminCategory } from "@/lib/admin-store";
import { uploadImage } from "@/lib/api";
import { showToast } from "@/lib/toast";

const emptyCategory: AdminCategory = {
  slug: "",
  name: "",
  image: "",
  group: "stencils",
  active: true,
  dbKey: "",
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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

  const submit = () => {
    if (!editing || !editing.draft.name.trim()) return;
    const draft = { ...editing.draft };
    if (!draft.slug) draft.slug = slugify(draft.name);
    saveCategory(draft, editing.originalSlug);
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const count = products.filter((p) => p.category === c.slug).length;
          return (
            <div
              key={c.slug}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]"
            >
              {c.image ? (
                <img src={c.image} alt={c.name} className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-muted text-[10px] text-muted-foreground">
                  IMG
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {count} products · {c.group}
                </p>
                <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  {c.active ? "Active" : "Hidden"}
                </span>
              </div>
              <div className="flex flex-col gap-2">
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
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setEditing(null)} />
          <div className="relative w-full rounded-t-3xl bg-card p-5 sm:max-w-md sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-primary">
                {editing.originalSlug ? "Edit Category" : "Add Category"}
              </h2>
              <button aria-label="Close" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">Name</span>
                <input
                  className={inputCls}
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
                  value={editing.draft.slug}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, slug: e.target.value } })
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">Group</span>
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
                {uploading ? "Uploading image…" : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
