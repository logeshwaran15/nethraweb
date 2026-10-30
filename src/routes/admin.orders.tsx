import { useEffect, useMemo, useState } from "react";
import { useSearchQuery } from "@/components/admin/useSearchQuery";
import { PageSizeSelect } from "@/components/admin/PageSizeSelect";
import {
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  IndianRupee,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DateRangePicker } from "@/components/admin/DatePickers";
import { Button } from "@/components/ui/button";
import { OrderInvoice, type InvoiceItem } from "@/components/shop/OrderInvoice";
import { apiGet, apiPut, fileUrl, uploadCourierBill } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { confirmAction } from "@/lib/confirm";
import { inr } from "@/lib/mock-data";

const statuses = ["All", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
type OrderStatus = Exclude<(typeof statuses)[number], "All">;
const editableStatuses: OrderStatus[] = ["Processing", "Shipped", "Delivered", "Cancelled"];

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
  PaymentStatus: string;
  RazorpayPaymentId: string | null;
  Subtotal: string | number;
  ShippingFee: string | number;
  CourierName: string | null;
  TrackingId: string | null;
  CourierBillPath: string | null;
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

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useSearchQuery();
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [draftCourier, setDraftCourier] = useState("");
  const [draftTracking, setDraftTracking] = useState("");
  const [draftBill, setDraftBill] = useState<string | null>(null);
  const [uploadingBill, setUploadingBill] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [invoiceFor, setInvoiceFor] = useState<OrderRow | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  const openInvoice = (o: OrderRow) => {
    setInvoiceFor(o);
    setInvoiceItems([]);
    apiGet<{ ProductName: string; Qty: string | number; Price: string | number }[]>(
      `/api/order_items.php?orderKey=${o.Orderkey}`,
    )
      .then((rows) =>
        setInvoiceItems(
          rows.map((r) => ({ name: r.ProductName, qty: Number(r.Qty), price: Number(r.Price) })),
        ),
      )
      .catch(() => setInvoiceItems([]));
  };

  const loadOrders = () => {
    setLoading(true);
    apiGet<OrderRow[]>("/api/orders.php")
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadOrders, []);

  const todaysOrderCount = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter((o) => new Date(o.CreatedOn).toDateString() === today).length;
  }, [orders]);

  const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

  const todayStr = (() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();
  const todayFilterOn = dateFrom === todayStr && dateTo === todayStr;

  const todaysRevenue = useMemo(
    () =>
      orders
        .filter((o) => isToday(o.CreatedOn) && o.Status !== "Cancelled")
        .reduce((s, o) => s + Number(o.Total), 0),
    [orders],
  );

  const countBy = (s: OrderStatus) => orders.filter((o) => o.Status === s).length;

  const pickStatus = (s: (typeof statuses)[number]) => {
    setDateFrom("");
    setDateTo("");
    setStatus((cur) => (cur === s ? "All" : s));
  };

  const orderCards = [
    {
      label: "Today's Orders",
      value: String(todaysOrderCount),
      icon: CalendarCheck,
      active: todayFilterOn,
      onClick: () => {
        setStatus("All");
        if (todayFilterOn) {
          setDateFrom("");
          setDateTo("");
        } else {
          setDateFrom(todayStr);
          setDateTo(todayStr);
        }
      },
      tone: {
        card: "border-primary/30 from-rose-50 to-white",
        bar: "bg-primary",
        text: "text-primary",
        chip: "from-primary to-rose-700 text-white",
        ring: "ring-primary",
      },
    },
    {
      label: "Today's Revenue",
      value: inr(todaysRevenue),
      icon: IndianRupee,
      active: false,
      onClick: () => {},
      tone: {
        card: "border-emerald-200 from-emerald-50 to-white",
        bar: "bg-emerald-500",
        text: "text-emerald-700",
        chip: "from-emerald-400 to-emerald-600 text-white",
        ring: "ring-emerald-500",
      },
    },
    {
      label: "Processing",
      value: String(countBy("Processing")),
      icon: Clock,
      active: status === "Processing",
      onClick: () => pickStatus("Processing"),
      tone: {
        card: "border-amber-200 from-amber-50 to-white",
        bar: "bg-amber-500",
        text: "text-amber-700",
        chip: "from-amber-400 to-orange-500 text-white",
        ring: "ring-amber-500",
      },
    },
    {
      label: "Shipped",
      value: String(countBy("Shipped")),
      icon: Truck,
      active: status === "Shipped",
      onClick: () => pickStatus("Shipped"),
      tone: {
        card: "border-sky-200 from-sky-50 to-white",
        bar: "bg-sky-500",
        text: "text-sky-700",
        chip: "from-sky-400 to-blue-600 text-white",
        ring: "ring-sky-500",
      },
    },
    {
      label: "Delivered",
      value: String(countBy("Delivered")),
      icon: PackageCheck,
      active: status === "Delivered",
      onClick: () => pickStatus("Delivered"),
      tone: {
        card: "border-violet-200 from-violet-50 to-white",
        bar: "bg-violet-500",
        text: "text-violet-700",
        chip: "from-violet-400 to-purple-600 text-white",
        ring: "ring-violet-500",
      },
    },
    {
      label: "Cancelled",
      value: String(countBy("Cancelled")),
      icon: XCircle,
      active: status === "Cancelled",
      onClick: () => pickStatus("Cancelled"),
      tone: {
        card: "border-red-200 from-red-50 to-white",
        bar: "bg-red-500",
        text: "text-red-700",
        chip: "from-red-400 to-red-600 text-white",
        ring: "ring-red-500",
      },
    },
  ];

  const list = useMemo(
    () =>
      orders.filter((o) => {
        if (status !== "All" && o.Status !== status) return false;
        if (query && !o.OrderNumber.toLowerCase().includes(query.toLowerCase())) return false;
        const created = new Date(o.CreatedOn);
        if (dateFrom && created < new Date(dateFrom)) return false;
        if (dateTo && created > new Date(dateTo + "T23:59:59")) return false;
        return true;
      }),
    [orders, query, status, dateFrom, dateTo],
  );

  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query, status, dateFrom, dateTo]);

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

  const toggleOrder = (o: OrderRow) => {
    if (expandedKey === o.Orderkey) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(o.Orderkey);
    setDraftCourier(o.CourierName ?? "");
    setDraftTracking(o.TrackingId ?? "");
    setDraftBill(o.CourierBillPath ?? null);
    setItems([]);
    apiGet<OrderItemRow[]>(`/api/order_items.php?orderKey=${o.Orderkey}`)
      .then(setItems)
      .catch(() => setItems([]));
  };

  // Status changes apply immediately — the reference behavior is "click a status to update."
  const updateStatus = async (order: OrderRow, next: OrderStatus) => {
    if (next === order.Status || updatingStatus) return;
    const ok = await confirmAction({
      title: "Update order status?",
      message: `Mark order ${order.OrderNumber} as ${next}?`,
      confirmText: "Update",
    });
    if (!ok) return;
    setUpdatingStatus(true);
    try {
      const updated = await apiPut<OrderRow>(`/api/orders.php?key=${order.Orderkey}`, {
        Status: next,
      });
      setOrders((list) => list.map((o) => (o.Orderkey === updated.Orderkey ? updated : o)));
      showToast(`Order ${updated.OrderNumber} marked ${next}`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const onBillSelected = async (file: File | undefined) => {
    if (!file) return;
    setUploadingBill(true);
    try {
      setDraftBill(await uploadCourierBill(file));
      showToast("Courier bill uploaded — click Save Tracking Info to attach it", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploadingBill(false);
    }
  };

  const saveTracking = async (order: OrderRow) => {
    setSavingTracking(true);
    try {
      const updated = await apiPut<OrderRow>(`/api/orders.php?key=${order.Orderkey}`, {
        CourierName: draftCourier || null,
        TrackingId: draftTracking || null,
        CourierBillPath: draftBill,
      });
      setOrders((list) => list.map((o) => (o.Orderkey === updated.Orderkey ? updated : o)));
      showToast("Tracking info saved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save tracking info", "error");
    } finally {
      setSavingTracking(false);
    }
  };

  return (
    <AdminLayout title="Orders" subtitle="Manage and track all customer orders.">
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {orderCards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={c.onClick}
            className={`group relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${c.tone.card} ${
              c.active ? `ring-2 ring-offset-1 ${c.tone.ring}` : ""
            }`}
          >
            <span
              className={`pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full opacity-20 ${c.tone.bar}`}
            />
            <div className="relative flex items-center gap-2.5">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${c.tone.chip}`}
              >
                <c.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p
                  className={`truncate text-[10px] font-bold uppercase tracking-wide ${c.tone.text}`}
                >
                  {c.label}
                </p>
                <p className="truncate font-sans text-2xl font-extrabold leading-tight text-[#2D2525]">
                  {c.value}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order #..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof statuses)[number])}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Status" : s}
            </option>
          ))}
        </select>
        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onChange={(f, t) => {
            setDateFrom(f);
            setDateTo(t);
          }}
        />
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-caption text-muted-foreground">
            {list.length} order{list.length === 1 ? "" : "s"}
          </span>
          <button
            aria-label="Refresh orders"
            onClick={loadOrders}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border text-primary hover:bg-accent"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {!loading && list.length === 0 && (
          <div className="rounded-sm border border-border bg-card py-10 text-center text-sm text-muted-foreground">
            No orders match your search.
          </div>
        )}

        {paged.map((o) => {
          const expanded = expandedKey === o.Orderkey;
          return (
            <div
              key={o.Orderkey}
              className="overflow-hidden rounded-sm border border-border bg-card shadow-[var(--shadow-card)]"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleOrder(o)}
                onKeyDown={(e) => e.key === "Enter" && toggleOrder(o)}
                className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <div>
                    <p className="text-label text-muted-foreground">Order #</p>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {o.OrderNumber}
                      {isToday(o.CreatedOn) && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
                          New
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-label text-muted-foreground">Customer</p>
                    <p className="text-sm font-semibold">{o.ShippingName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-label text-muted-foreground">Amount</p>
                    <p className="text-sm font-semibold">{inr(Number(o.Total))}</p>
                  </div>
                  <div>
                    <p className="text-label text-muted-foreground">Date</p>
                    <p className="text-sm font-semibold">
                      {new Date(o.CreatedOn).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${statusStyles[o.Status]}`}
                  >
                    {o.Status}
                  </span>
                  {o.PaymentStatus && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                      {o.PaymentStatus}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`View invoice for ${o.OrderNumber}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openInvoice(o);
                    }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-primary hover:bg-accent"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </button>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </div>
                {o.ShippingAddress && (
                  <div className="w-full">
                    <p className="text-label text-muted-foreground">Address</p>
                    <p className="line-clamp-2 text-sm">{o.ShippingAddress}</p>
                  </div>
                )}
              </div>

              {expanded && (
                <div className="border-t border-border p-4">
                  <div>
                    <p className="text-label mb-2 text-muted-foreground">Update Order Status</p>
                    <div className="flex flex-wrap gap-2">
                      {editableStatuses.map((s) => (
                        <button
                          key={s}
                          disabled={updatingStatus}
                          onClick={() => updateStatus(o, s)}
                          className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase disabled:opacity-60 ${
                            o.Status === s
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <p className="text-caption mt-1.5 text-muted-foreground">
                      Click a status to update it immediately.
                    </p>
                  </div>

                  {o.ShippingAddress && (
                    <div className="text-caption mt-4 rounded-xl bg-muted/50 p-3 text-muted-foreground">
                      <p className="font-semibold text-primary">
                        {o.ShippingName} · {o.ShippingPhone}
                      </p>
                      <p className="mt-1">{o.ShippingAddress}</p>
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border border-border p-3">
                    <p className="text-label mb-2 text-muted-foreground">Tracking &amp; Courier</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-caption mb-1 block text-muted-foreground">
                          Courier Name
                        </span>
                        <input
                          value={draftCourier}
                          onChange={(e) => setDraftCourier(e.target.value)}
                          placeholder="e.g. BlueDart"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </label>
                      <label className="block">
                        <span className="text-caption mb-1 block text-muted-foreground">
                          Tracking ID
                        </span>
                        <input
                          value={draftTracking}
                          onChange={(e) => setDraftTracking(e.target.value)}
                          placeholder="e.g. SF123456789IN"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </label>
                    </div>
                    <div className="mt-3">
                      <span className="text-caption mb-1 block text-muted-foreground">
                        Courier Bill (image or PDF)
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-dashed border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-accent">
                          <Upload className="h-4 w-4" />
                          {uploadingBill
                            ? "Uploading…"
                            : draftBill
                              ? "Replace file"
                              : "Upload file"}
                          <input
                            type="file"
                            accept="image/*,application/pdf,.pdf"
                            className="hidden"
                            disabled={uploadingBill}
                            onChange={(e) => {
                              void onBillSelected(e.target.files?.[0]);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {draftBill && (
                          <>
                            {/.pdf$/i.test(draftBill) ? (
                              <a
                                href={fileUrl(draftBill)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-sm font-semibold text-primary underline"
                              >
                                <FileText className="h-4 w-4" /> View PDF
                              </a>
                            ) : (
                              <a href={fileUrl(draftBill)} target="_blank" rel="noreferrer">
                                <img
                                  src={fileUrl(draftBill)}
                                  alt="Courier bill"
                                  className="h-16 w-16 rounded-sm border border-border object-cover"
                                />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setDraftBill(null)}
                              className="text-xs font-semibold text-destructive hover:underline"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => saveTracking(o)}
                      disabled={savingTracking}
                      variant="brand"
                      size="sm"
                      className="mt-3"
                    >
                      {savingTracking ? "Saving…" : "Save Tracking Info"}
                    </Button>
                  </div>

                  <div className="mt-4">
                    <p className="text-label mb-2 text-muted-foreground">Items Ordered</p>
                    <ul className="space-y-2">
                      {items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 rounded-xl border border-border p-2.5"
                        >
                          <img
                            src={item.ProductImagePath ?? ""}
                            alt={item.ProductName}
                            className="h-11 w-11 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{item.ProductName}</p>
                            <p className="text-caption text-muted-foreground">
                              {inr(Number(item.Price))} × {item.Qty}
                            </p>
                          </div>
                          <span className="text-sm font-semibold">
                            {inr(Number(item.Price) * Number(item.Qty))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {list.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-caption text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, list.length)} of{" "}
            {list.length}
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
            <span className="text-caption font-semibold">
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
      )}

      {invoiceFor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 p-4 print:static print:bg-transparent print:p-0">
          <div className="mx-auto max-w-2xl print:max-w-none">
            <button
              onClick={() => setInvoiceFor(null)}
              className="mb-3 ml-auto flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-[var(--shadow-card)] print:hidden"
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
            <OrderInvoice
              order={{
                orderNumber: invoiceFor.OrderNumber,
                createdOn: invoiceFor.CreatedOn,
                shippingName: invoiceFor.ShippingName,
                shippingPhone: invoiceFor.ShippingPhone,
                shippingAddress: invoiceFor.ShippingAddress,
                paymentMethod: invoiceFor.PaymentMethod,
                paymentStatus: invoiceFor.PaymentStatus,
                paymentReference: invoiceFor.RazorpayPaymentId,
                subtotal: Number(invoiceFor.Subtotal),
                shippingFee: Number(invoiceFor.ShippingFee),
                total: Number(invoiceFor.Total),
              }}
              items={invoiceItems}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
