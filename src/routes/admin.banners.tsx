import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin, type Banner } from "@/lib/admin-store";
import { uploadImage } from "@/lib/api";
import { showToast } from "@/lib/toast";

export const Route = createFileRoute("/admin/banners")({
  head: () => ({
    meta: [
      { title: "Banners — Nethra's Admin" },
      { name: "description", content: "Manage home and promo banners for Nethra's store." },
      { property: "og:title", content: "Banners — Nethra's Admin" },
      { property: "og:description", content: "Manage home and promo banners." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBanners,
});

const emptyBanner: Banner = {
  id: "",
  title: "",
  subtitle: "",
  imagePath: "",
  linkUrl: "",
  buttonText: "",
  placement: "home",
  sortOrder: 0,
  active: true,
};

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";
const labelCls = "mb-1 block text-xs font-semibold text-muted-foreground";

const genId = () => `BNR-${Date.now()}`;

function AdminBanners() {
  const { banners, saveBanner, deleteBanner } = useAdmin();
  const [editing, setEditing] = useState<{ draft: Banner; originalId?: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);

  const submit = () => {
    if (!editing || !editing.draft.title.trim()) return;
    const draft = { ...editing.draft };
    if (!draft.id) draft.id = genId();
    saveBanner(draft, editing.originalId);
    setEditing(null);
  };

  const pickImage = async (file: File | undefined) => {
    if (!file || !editing) return;
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setEditing((cur) => (cur ? { ...cur, draft: { ...cur.draft, imagePath: url } } : cur));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout
      title="Banners"
      subtitle={`${banners.length} banners configured`}
      actions={
        <button
          onClick={() => {
            setImagePreview(null);
            setEditing({ draft: { ...emptyBanner } });
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
        >
          <Plus className="h-4 w-4" /> Add Banner
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((b) => (
          <div
            key={b.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
          >
            {b.imagePath && b.imagePath !== "pending-upload" ? (
              <img src={b.imagePath} alt={b.title || "Banner"} className="h-32 w-full object-cover" />
            ) : (
              <div className="grid h-32 place-items-center bg-muted text-[10px] text-muted-foreground">
                No image uploaded
              </div>
            )}
            <div className="p-3">
              <p className="truncate text-sm font-bold">{b.title || "Untitled banner"}</p>
              <p className="truncate text-[11px] text-muted-foreground">{b.subtitle}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold capitalize text-accent-foreground">
                  {b.placement}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    b.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {b.active ? "Active" : "Hidden"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setEditing({ draft: { ...b }, originalId: b.id });
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-semibold text-primary hover:bg-accent"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => deleteBanner(b.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No banners yet. Add one to get started.
          </p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setEditing(null)} />
          <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 sm:max-w-lg sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-primary">
                {editing.originalId ? "Edit Banner" : "Add Banner"}
              </h2>
              <button aria-label="Close" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className={labelCls}>Title</span>
                <input
                  className={inputCls}
                  placeholder="Enter banner title"
                  value={editing.draft.title}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, title: e.target.value } })
                  }
                />
              </label>
              <label className="block">
                <span className={labelCls}>Subtitle</span>
                <input
                  className={inputCls}
                  placeholder="Enter banner subtitle"
                  value={editing.draft.subtitle}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, subtitle: e.target.value } })
                  }
                />
              </label>
              <label className="block">
                <span className={labelCls}>Banner Image</span>
                <p className="mb-1.5 text-[11px] text-muted-foreground">
                  Recommended size: 1200 × 900px (4:3 ratio), JPG/PNG/WEBP, under 5MB
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => pickImage(e.target.files?.[0])}
                  className={`${inputCls} py-1.5`}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Banner preview"
                    className="mt-2 h-28 w-full rounded-xl border border-border object-cover"
                  />
                )}
                {uploading && <p className="mt-1 text-[11px] text-muted-foreground">Uploading…</p>}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Link URL</span>
                  <input
                    className={inputCls}
                    placeholder="/categories"
                    value={editing.draft.linkUrl}
                    onChange={(e) =>
                      setEditing({ ...editing, draft: { ...editing.draft, linkUrl: e.target.value } })
                    }
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Button Text</span>
                  <input
                    className={inputCls}
                    placeholder="Enter button text"
                    value={editing.draft.buttonText}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, buttonText: e.target.value },
                      })
                    }
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Placement</span>
                  <select
                    className={inputCls}
                    value={editing.draft.placement}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, placement: e.target.value as Banner["placement"] },
                      })
                    }
                  >
                    <option value="home">Home</option>
                    <option value="category">Category</option>
                    <option value="offer">Offer</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>Sort Order</span>
                  <input
                    type="number"
                    className={inputCls}
                    value={editing.draft.sortOrder}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, sortOrder: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={editing.draft.active}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, active: e.target.checked } })
                  }
                />
                Active on storefront
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
                {uploading ? "Uploading image…" : "Save Banner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
