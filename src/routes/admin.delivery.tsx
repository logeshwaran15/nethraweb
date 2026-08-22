import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin, type DeliveryZone } from "@/lib/admin-store";
import { inr } from "@/lib/mock-data";
import { showToast } from "@/lib/toast";

const emptyZone: DeliveryZone = {
  id: "",
  zoneName: "",
  pincodePrefix: "",
  deliveryFee: 0,
  freeShippingAbove: 0,
  estimatedDays: "3-5 days",
  sortOrder: 0,
  active: true,
};

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";
const labelCls = "mb-1 block text-xs font-semibold text-muted-foreground";

export default function AdminDelivery() {
  const { deliveryZones, saveDeliveryZone, deleteDeliveryZone } = useAdmin();
  const [editing, setEditing] = useState<{ draft: DeliveryZone; originalId?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = [...deliveryZones].sort((a, b) => a.sortOrder - b.sortOrder);

  const submit = async () => {
    if (!editing) return;
    const draft = { ...editing.draft, pincodePrefix: editing.draft.pincodePrefix.trim() };
    if (!draft.zoneName.trim() || !draft.pincodePrefix) return;
    setSaving(true);
    try {
      await saveDeliveryZone(draft, editing.originalId);
      showToast(`Delivery zone "${draft.zoneName}" saved`, "success");
      setEditing(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save delivery zone", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (zone: DeliveryZone) => {
    try {
      await deleteDeliveryZone(zone.id);
      showToast(`Delivery zone "${zone.zoneName}" deleted`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete delivery zone", "error");
    }
  };

  return (
    <AdminLayout
      title="Delivery Charges"
      subtitle={`${deliveryZones.length} pincode zones configured`}
      actions={
        <button
          onClick={() => setEditing({ draft: { ...emptyZone } })}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
        >
          <Plus className="h-4 w-4" /> Add Zone
        </button>
      }
    >
      <p className="text-xs text-muted-foreground">
        Checkout matches the customer's pincode against the <strong>longest matching prefix</strong> below to
        pick a zone. If no zone matches, the flat shipping fee from Settings → Payment is used instead.
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Pincode Prefix</th>
                <th className="px-4 py-3">Delivery Fee</th>
                <th className="px-4 py-3">Free Above</th>
                <th className="px-4 py-3">ETA</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((z) => (
                <tr key={z.id} className="border-t border-border align-middle">
                  <td className="px-4 py-3 font-semibold">{z.zoneName}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{z.pincodePrefix}*</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {z.deliveryFee ? inr(z.deliveryFee) : "Free"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {z.freeShippingAbove ? inr(z.freeShippingAbove) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{z.estimatedDays}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        z.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {z.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        aria-label={`Edit ${z.zoneName}`}
                        onClick={() => setEditing({ draft: { ...z }, originalId: z.id })}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-primary hover:bg-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Delete ${z.zoneName}`}
                        onClick={() => remove(z)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {deliveryZones.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No delivery zones yet. Add one to get started.
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
          <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 sm:max-w-lg sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-primary">
                {editing.originalId ? "Edit Delivery Zone" : "Add Delivery Zone"}
              </h2>
              <button aria-label="Close" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className={labelCls}>Zone Name</span>
                <input
                  className={inputCls}
                  placeholder="e.g. Coimbatore Local"
                  value={editing.draft.zoneName}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, zoneName: e.target.value } })
                  }
                />
              </label>

              <label className="block">
                <span className={labelCls}>Pincode Prefix</span>
                <input
                  className={`${inputCls} font-mono`}
                  placeholder="e.g. 641 or 641002"
                  value={editing.draft.pincodePrefix}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, pincodePrefix: e.target.value },
                    })
                  }
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Delivery Fee (₹)</span>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="Enter delivery fee"
                    value={editing.draft.deliveryFee}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, deliveryFee: Number(e.target.value) },
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Free Shipping Above (₹)</span>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="0 = never free"
                    value={editing.draft.freeShippingAbove}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, freeShippingAbove: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Estimated Delivery</span>
                  <input
                    className={inputCls}
                    placeholder="e.g. 3-5 days"
                    value={editing.draft.estimatedDays}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, estimatedDays: e.target.value },
                      })
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
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={editing.draft.active}
                  onChange={(e) =>
                    setEditing({ ...editing, draft: { ...editing.draft, active: e.target.checked } })
                  }
                />
                Active for checkout
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
                disabled={saving}
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Zone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
