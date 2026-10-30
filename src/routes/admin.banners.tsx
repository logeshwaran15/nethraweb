import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Req } from "@/components/admin/Req";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Switch } from "@/components/ui/switch";
import { useAdmin, type Banner } from "@/lib/admin-store";
import { uploadImage } from "@/lib/api";
import { showToast } from "@/lib/toast";

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

export default function AdminBanners() {
  const { banners, saveBanner, deleteBanner } = useAdmin();
  const [editing, setEditing] = useState<{ draft: Banner; originalId?: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);

  const submit = async () => {
    if (!editing || !editing.draft.title.trim()) return;
    const draft = { ...editing.draft };
    if (!draft.id) draft.id = genId();
    if ((await saveBanner(draft, editing.originalId)) === false) return;
    setEditing(null);
  };

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleActive = async (b: Banner) => {
    setTogglingId(b.id);
    try {
      await saveBanner({ ...b, active: !b.active }, b.id, { silent: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update banner", "error");
    } finally {
      setTogglingId(null);
    }
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
      <div className="overflow-hidden rounded-sm border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Banner</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => (
                <tr key={b.id} className="border-t border-border align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {b.imagePath && b.imagePath !== "pending-upload" ? (
                        <img
                          src={b.imagePath}
                          alt={b.title || "Banner"}
                          className="h-10 w-14 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="grid h-10 w-14 shrink-0 place-items-center rounded-lg bg-muted text-[9px] text-muted-foreground">
                          No image
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{b.title || "Untitled banner"}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{b.subtitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{b.placement}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={b.active}
                        disabled={togglingId === b.id}
                        onCheckedChange={() => toggleActive(b)}
                        aria-label={`${b.active ? "Hide" : "Show"} ${b.title || "banner"}`}
                      />
                      <span
                        className={`text-[11px] font-semibold ${
                          b.active ? "text-success" : "text-muted-foreground"
                        }`}
                      >
                        {b.active ? "Active" : "Hidden"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        aria-label={`Edit ${b.title || "banner"}`}
                        onClick={() => {
                          setImagePreview(null);
                          setEditing({ draft: { ...b }, originalId: b.id });
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary hover:bg-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Delete ${b.title || "banner"}`}
                        onClick={() => deleteBanner(b.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No banners yet. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setEditing(null)} />
          <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-sm bg-card p-5 sm:max-w-lg sm:rounded-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-xl text-primary">
                {editing.originalId ? "Edit Banner" : "Add Banner"}
              </h2>
              <button aria-label="Close" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className={labelCls}>Title<Req /></span>
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
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, subtitle: e.target.value },
                    })
                  }
                />
              </label>
              <label className="block">
                <span className={labelCls}>Banner Image</span>
                <p className="mb-1.5 text-[11px] text-muted-foreground">
                  Recommended size: 1800 × 600px (3:1 ratio, same on laptop and mobile), JPG/PNG/WEBP. Keep text and logo in the centre. Under 300KB is best
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
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, linkUrl: e.target.value },
                      })
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
                        draft: {
                          ...editing.draft,
                          placement: e.target.value as Banner["placement"],
                        },
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
                    placeholder="Enter sort order"
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
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, active: e.target.checked },
                    })
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
