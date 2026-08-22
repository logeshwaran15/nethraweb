import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Search, Truck, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { apiGet, apiPut } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { inr } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Nethra's Admin" },
      { name: "description", content: "View and manage customer orders for Nethra's store." },
      { property: "og:title", content: "Orders — Nethra's Admin" },
      { property: "og:description", content: "View and manage customer orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrders,
});

const statuses = ["All", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
type OrderStatus = Exclude<(typeof statuses)[number], "All">;
const statusFlow: OrderStatus[] = ["Processing", "Shipped", "Delivered"];

const statusStyles: Record<OrderStatus, string> = {
  Processing: "bg-gold-soft text-primary",
  Shipped: "bg-accent text-accent-foreground",
  Delivered: "bg-success/15 text-success",
  Cancelled: "bg-destructive/10 text-destructive",
};

type OrderRow = {
  Orderkey: string;
  OrderNumber: string;
  Status: OrderStatus;
  PaymentMethod: string;
  CourierName: string | null;
  TrackingId: string | null;
  ShippingName: string | null;
  ShippingPhone: string | null;
  ShippingAddress: string | null;
  Total: string | number;
  CreatedOn: string;
};

type OrderItemRow = {
  ProductName: string;
  ProductImagePath: string | null;
  Qty: string | number;
  Price: string | number;
};

const PAGE_SIZE = 8;

function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [draftStatus, setDraftStatus] = useState<OrderStatus>("Processing");
  const [draftCourier, setDraftCourier] = useState("");
  const [draftTracking, setDraftTracking] = useState("");
  const [saving, setSaving] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    apiGet<OrderRow[]>("/api/orders.php")
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadOrders, []);

  const list = useMemo(
    () =>
      orders.filter(
        (o) =>
          (status === "All" || o.Status === status) &&
          o.OrderNumber.toLowerCase().includes(query.toLowerCase()),
      ),
    [orders, query, status],
  );

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paged = useMemo(() => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [list, page]);

  const openOrder = (o: OrderRow) => {
    setViewing(o);
    setDraftStatus(o.Status);
    setDraftCourier(o.CourierName ?? "");
    setDraftTracking(o.TrackingId ?? "");
    setItems([]);
    apiGet<OrderItemRow[]>(`/api/order_items.php?orderKey=${o.Orderkey}`)
      .then(setItems)
      .catch(() => setItems([]));
  };

  const saveOrder = async () => {
    if (!viewing) return;
    setSaving(true);
    try {
      const updated = await apiPut<OrderRow>(`/api/orders.php?key=${viewing.Orderkey}`, {
        Status: draftStatus,
        CourierName: draftCourier || null,
        TrackingId: draftTracking || null,
      });
      setOrders((list) => list.map((o) => (o.Orderkey === updated.Orderkey ? updated : o)));
      setViewing(updated);
      showToast(`Order ${updated.OrderNumber} updated`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update order", "error");
    } finally {
      setSaving(false);
    }
  };

  const nextStatus = viewing
    ? statusFlow[statusFlow.indexOf(draftStatus) + 1]
    : undefined;

  return (
    <AdminLayout title="Orders" subtitle={`${orders.length} orders placed`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${
                status === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Courier</th>
                <th className="px-4 py-3">Tracking ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((o) => (
                <tr key={o.Orderkey} className="border-t border-border align-middle">
                  <td className="px-4 py-3 font-semibold">{o.OrderNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(o.CreatedOn).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.CourierName || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.TrackingId || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[o.Status]}`}
                    >
                      {o.Status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-primary">
                    {inr(Number(o.Total))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openOrder(o)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No orders match your search.
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

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setViewing(null)} />
          <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 sm:max-w-md sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl text-primary">{viewing.OrderNumber}</h2>
                <p className="text-xs text-muted-foreground">
                  {new Date(viewing.CreatedOn).toLocaleString("en-IN")}
                </p>
              </div>
              <button aria-label="Close" onClick={() => setViewing(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <ul className="space-y-3">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <img
                    src={item.ProductImagePath ?? ""}
                    alt={item.ProductName}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.ProductName}</p>
                    <p className="text-[11px] text-muted-foreground">Qty {item.Qty}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {inr(Number(item.Price) * Number(item.Qty))}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex justify-between border-t border-border pt-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">{inr(Number(viewing.Total))}</span>
            </div>

            {viewing.ShippingAddress && (
              <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-primary">
                  {viewing.ShippingName} · {viewing.ShippingPhone}
                </p>
                <p className="mt-1">{viewing.ShippingAddress}</p>
              </div>
            )}

            <div className="mt-5 space-y-3 border-t border-border pt-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Order Status
                </span>
                <div className="flex flex-wrap gap-2">
                  {statuses
                    .filter((s): s is OrderStatus => s !== "All")
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => setDraftStatus(s)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          draftStatus === s
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                </div>
                {nextStatus && (
                  <button
                    onClick={() => setDraftStatus(nextStatus)}
                    className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-primary"
                  >
                    <Truck className="h-3.5 w-3.5" /> Advance to {nextStatus}
                  </button>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Courier Name
                </span>
                <input
                  value={draftCourier}
                  onChange={(e) => setDraftCourier(e.target.value)}
                  placeholder="Enter courier name"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Parcel / Tracking ID
                </span>
                <input
                  value={draftTracking}
                  onChange={(e) => setDraftTracking(e.target.value)}
                  placeholder="Enter parcel tracking ID"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setViewing(null)}
                className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={saveOrder}
                disabled={saving}
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
