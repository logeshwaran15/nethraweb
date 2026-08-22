import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin, type Announcement } from "@/lib/admin-store";

const useSelection = (ids: string[]) => {
  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = ids.length > 0 && selected.length === ids.length;
  const toggleAll = () => setSelected(allSelected ? [] : [...ids]);
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clear = () => setSelected([]);
  return { selected, allSelected, toggleAll, toggleOne, clear };
};

export const Route = createFileRoute("/admin/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Nethra's Admin" },
      { name: "description", content: "Manage the top strip announcement messages for Nethra's store." },
      { property: "og:title", content: "Announcements — Nethra's Admin" },
      { property: "og:description", content: "Manage the top strip announcement messages." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAnnouncements,
});

const emptyAnnouncement: Announcement = {
  id: "",
  message: "",
  linkUrl: "",
  sortOrder: 0,
  active: true,
};

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";
const labelCls = "mb-1 block text-xs font-semibold text-muted-foreground";

const genId = () => `ANN-${Date.now()}`;

function AdminAnnouncements() {
  const { announcements, saveAnnouncement, deleteAnnouncement } = useAdmin();
  const [editing, setEditing] = useState<{ draft: Announcement; originalId?: string } | null>(null);

  const sorted = [...announcements].sort((a, b) => a.sortOrder - b.sortOrder);
  const { selected, allSelected, toggleAll, toggleOne, clear } = useSelection(sorted.map((a) => a.id));

  const submit = () => {
    if (!editing || !editing.draft.message.trim()) return;
    const draft = { ...editing.draft };
    if (!draft.id) draft.id = genId();
    saveAnnouncement(draft, editing.originalId);
    setEditing(null);
  };

  const deleteSelected = async () => {
    await Promise.all(selected.map((id) => deleteAnnouncement(id)));
    clear();
  };

  return (
    <AdminLayout
      title="Announcements"
      subtitle={`${announcements.length} announcements configured`}
      actions={
        <button
          onClick={() => setEditing({ draft: { ...emptyAnnouncement } })}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
        >
          <Plus className="h-4 w-4" /> Add Announcement
        </button>
      }
    >
      {sorted.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-2.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            {selected.length > 0 ? `${selected.length} selected` : "Select all"}
          </label>
          {selected.length > 0 && (
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1.5 rounded-full border border-destructive px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Selected
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((a) => (
          <div
            key={a.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 shrink-0"
                checked={selected.includes(a.id)}
                onChange={() => toggleOne(a.id)}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{a.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Sort order {a.sortOrder}
                  {a.linkUrl ? ` · Links to ${a.linkUrl}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  a.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {a.active ? "Active" : "Hidden"}
              </span>
              <button
                aria-label={`Edit announcement`}
                onClick={() => setEditing({ draft: { ...a }, originalId: a.id })}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary hover:bg-accent"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                aria-label={`Delete announcement`}
                onClick={() => deleteAnnouncement(a.id)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No announcements yet. Add one to get started.
          </p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setEditing(null)} />
          <div className="relative w-full rounded-t-3xl bg-card p-5 sm:max-w-md sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-primary">
                {editing.originalId ? "Edit Announcement" : "Add Announcement"}
              </h2>
              <button aria-label="Close" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className={labelCls}>Message</span>
                <textarea
                  rows={2}
                  className={inputCls}
                  placeholder="Enter announcement message"
                  value={editing.draft.message}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, message: e.target.value } })
                  }
                />
              </label>
              <label className="block">
                <span className={labelCls}>Link URL (optional)</span>
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
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Save Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
