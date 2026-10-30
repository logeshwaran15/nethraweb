import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Bike,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Copy,
  ExternalLink,
  Headset,
  Home,
  Package,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { apiGet, fileUrl } from "@/lib/api";
import { inr } from "@/lib/mock-data";
import { Screen } from "@/components/shop/AppChrome";

type StepState = "done" | "current" | "pending";

// One icon per tracking step: placed, confirmed, shipped, out for delivery, delivered.
const stepIcons = [ClipboardList, CheckCircle2, Package, Bike, Home];

type OrderRow = {
  Orderkey: string;
  OrderNumber: string;
  Status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  CourierName: string | null;
  TrackingId: string | null;
  CourierBillPath: string | null;
  ShippingName: string | null;
  ShippingPhone: string | null;
  ShippingAddress: string | null;
  CreatedOn?: string;
  PaymentMethod?: string;
  PaymentStatus?: string;
};

type ItemRow = {
  ProductName: string;
  ProductImagePath: string | null;
  Qty: string | number;
  Price: string | number;
};

type TrackEvent = { Status: string; CreatedOn: string };
type TrackStep = { label: string; eta: string; note: string };

const fmtDateTime = (v?: string) =>
  v
    ? new Date(v.replace(" ", "T")).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// Everything below comes from the order itself and its recorded status changes — nothing is made up.
function buildSteps(order: OrderRow, events: TrackEvent[]): TrackStep[] {
  const when = (status: string) => events.filter((e) => e.Status === status).at(-1)?.CreatedOn;
  const placedAt = fmtDateTime(order.CreatedOn);
  const shippedAt = fmtDateTime(when("Shipped"));
  const deliveredAt = fmtDateTime(when("Delivered"));
  const shippedOrBeyond = order.Status === "Shipped" || order.Status === "Delivered";
  const delivered = order.Status === "Delivered";

  const courierBits =
    order.CourierName || order.TrackingId
      ? `Handed over to ${order.CourierName ?? "our courier partner"}${
          order.TrackingId ? `. Tracking ID: ${order.TrackingId}` : ""
        }.`
      : "Your order has been handed over to the courier.";

  return [
    {
      label: "Order Placed",
      eta: placedAt ? `Placed on ${placedAt}` : "Order received",
      note: "We received your order.",
    },
    {
      label: "Order Confirmed",
      eta: order.PaymentStatus === "Paid" ? "Payment received" : "Order confirmed",
      note: "Your order is confirmed and is being packed.",
    },
    {
      label: "Shipped",
      eta: shippedOrBeyond
        ? shippedAt
          ? `Shipped on ${shippedAt}`
          : "Shipped"
        : "Not shipped yet",
      note: shippedOrBeyond
        ? courierBits
        : "We'll update this once your order is handed to the courier.",
    },
    {
      label: "Out for Delivery",
      eta: delivered ? "Completed" : "Pending",
      note: delivered
        ? "Your parcel reached you."
        : "We'll update this when your parcel is out for delivery.",
    },
    {
      label: "Delivered",
      eta: delivered
        ? deliveredAt
          ? `Delivered on ${deliveredAt}`
          : "Delivered"
        : "Awaiting delivery",
      note: delivered
        ? "Your order has been delivered. Thank you for shopping with Nethra's!"
        : "We'll update this once your order is delivered.",
    },
  ];
}

const stepForStatus: Record<OrderRow["Status"], number> = {
  Processing: 1,
  Shipped: 2,
  Delivered: 4,
  Cancelled: 1,
};

export default function TrackPage() {
  const [searchParams] = useSearchParams();
  const orderKey = searchParams.get("order") ?? undefined;
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [expanded, setExpanded] = useState<number | null>(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [events, setEvents] = useState<TrackEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      if (orderKey) {
        const o = await apiGet<OrderRow>(`/api/orders.php?key=${orderKey}`).catch(() => null);
        setOrder(o);
        setNotFound(!o);
      } else {
        setOrder(null);
      }
      setLoading(false);
    };
    load();
  }, [orderKey]);

  useEffect(() => {
    if (!order) {
      setEvents([]);
      return;
    }
    apiGet<TrackEvent[]>(`/api/order_tracking.php?orderKey=${order.Orderkey}`)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [order?.Orderkey]);

  useEffect(() => {
    if (!order) {
      setItems([]);
      return;
    }
    apiGet<ItemRow[]>(`/api/order_items.php?orderKey=${order.Orderkey}`)
      .then(setItems)
      .catch(() => setItems([]));
  }, [order?.Orderkey]);

  const searchByNumber = async () => {
    const number = query.trim();
    if (!number) return;
    setSearching(true);
    setNotFound(false);
    const o = await apiGet<OrderRow>(`/api/orders.php?number=${encodeURIComponent(number)}`).catch(
      () => null,
    );
    setOrder(o);
    setNotFound(!o);
    setSearching(false);
  };

  const cardCls =
    "rounded-xl border border-[#E9DADA] bg-white shadow-[0_1px_8px_rgba(45,37,37,0.04)]";

  const breadcrumb = (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-[#786B6B]">
      <Link to="/" className="hover:text-[#8E1828]">
        Home
      </Link>
      <span>/</span>
      <Link to="/orders" className="hover:text-[#8E1828]">
        Orders
      </Link>
      <span>/</span>
      <span className="font-semibold text-[#8E1828]">Track Order</span>
    </nav>
  );

  const pageHeading = (
    <div className="mb-6 flex items-center gap-4">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#FDF0F0] text-[#8E1828]">
        <Truck className="h-7 w-7" />
      </span>
      <div>
        <h1 className="font-display text-[28px] font-semibold leading-tight text-[#8E1828] md:text-[32px]">
          Track Your Order
        </h1>
        <p className="text-[13px] text-[#786B6B]">
          Stay updated with your order status in real time.
        </p>
      </div>
    </div>
  );

  if (!order) {
    return (
      <Screen title="Track Order" back>
        <div className="bg-[#FFF9F5] px-4 pb-12 pt-5 md:px-8 md:pt-8">
          <div className="mx-auto max-w-[640px]">
            {breadcrumb}
            {pageHeading}
            <div className={`${cardCls} p-5 md:p-6`}>
              <p className="font-display text-xl font-semibold text-[#2D2525]">
                Enter your Order ID
              </p>
              <p className="mt-1 text-[13px] text-[#786B6B]">
                Enter your Order ID to see the latest status, e.g. NS1234567890.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchByNumber()}
                  aria-label="Order ID"
                  placeholder="Order ID"
                  className="h-12 min-w-0 flex-1 rounded-lg border border-[#E9DADA] bg-white px-4 text-sm outline-none focus:border-[#8E1828] focus:ring-4 focus:ring-[#FDF0F0]"
                />
                <button
                  onClick={searchByNumber}
                  disabled={searching || !query.trim()}
                  className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#8E1828] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#741421] disabled:opacity-60"
                >
                  <Search className="h-4 w-4" /> {searching ? "Searching…" : "Track"}
                </button>
              </div>
            </div>

            {!loading &&
              (notFound ? (
                <div className={`${cardCls} mt-4 p-6 text-center`}>
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
                    <XCircle className="h-6 w-6" />
                  </span>
                  <p className="mt-3 font-display text-lg font-semibold text-[#2D2525]">
                    Order Not Found
                  </p>
                  <p className="mt-1 text-[13px] text-[#786B6B]">
                    We couldn&apos;t find an order with that ID. Please check the Order ID and try
                    again.
                  </p>
                  <button
                    onClick={() => {
                      setQuery("");
                      setNotFound(false);
                    }}
                    className="mt-4 h-10 rounded-lg border border-[#8E1828] px-5 text-sm font-semibold text-[#8E1828] hover:bg-[#FDF0F0]"
                  >
                    Try Again
                  </button>
                </div>
              ) : !orderKey ? (
                <p className="mt-4 text-center text-[13px] text-[#786B6B]">
                  Or check{" "}
                  <Link to="/orders" className="font-semibold text-[#8E1828] underline">
                    My Orders
                  </Link>{" "}
                  to track a past order.
                </p>
              ) : null)}
          </div>
        </div>
      </Screen>
    );
  }

  const cancelled = order.Status === "Cancelled";
  const currentStep = stepForStatus[order.Status];
  const trackingSteps = buildSteps(order, events);
  const total = trackingSteps.length;
  const percent = Math.round(((currentStep + 1) / total) * 100);
  const delivered = order.Status === "Delivered";

  const statusStyle = cancelled
    ? "bg-[#D92D20] text-white"
    : delivered
      ? "bg-[#2E9B61] text-white"
      : order.Status === "Shipped"
        ? "bg-[#2F6FD0] text-white"
        : "bg-[#8E1828] text-white";

  const headline = cancelled
    ? "This order was cancelled"
    : delivered
      ? "Your order has been delivered"
      : order.Status === "Shipped"
        ? "Your order is on the way"
        : "Your order is being prepared";
  const subline = cancelled
    ? ""
    : delivered
      ? (trackingSteps[4]?.eta ?? "Delivered")
      : order.Status === "Shipped"
        ? (trackingSteps[2]?.eta ?? "Shipped")
        : (trackingSteps[0]?.eta ?? "In progress");

  const orderDate = order.CreatedOn
    ? new Date(order.CreatedOn.replace(" ", "T")).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
  const hasCourier = Boolean(order.CourierName || order.TrackingId || order.CourierBillPath);

  const copyOrderId = () => {
    void navigator.clipboard?.writeText(order.OrderNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Screen title="Track Order" back>
      <div className="bg-[#FFF9F5] px-4 pb-12 pt-5 md:px-8 md:pt-8">
        <div className="mx-auto max-w-[1240px]">
          {breadcrumb}
          {pageHeading}

          <div className="md:grid md:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] md:items-start md:gap-6">
            {/* Left column */}
            <div className="space-y-5">
              {/* Order id + status + progress */}
              <section className={`${cardCls} p-5 md:p-6`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#786B6B]">
                      Order ID
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="truncate font-sans text-[24px] font-bold leading-tight tracking-wide text-[#8E1828]">
                        {order.OrderNumber}
                      </p>
                      <button
                        onClick={copyOrderId}
                        aria-label="Copy order ID"
                        title={copied ? "Copied" : "Copy order ID"}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#786B6B] hover:bg-[#FDF0F0] hover:text-[#8E1828]"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-[#2E9B61]" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <span
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide ${statusStyle}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" /> {order.Status}
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-[#FFF7F7] p-4">
                  <div
                    className={`flex items-center gap-2 text-[15px] font-semibold ${cancelled ? "text-destructive" : "text-[#8E1828]"}`}
                  >
                    {cancelled ? (
                      <XCircle className="h-5 w-5" />
                    ) : delivered ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Truck className="h-5 w-5" />
                    )}
                    {headline}
                  </div>
                  {subline && <p className="mt-1 text-[13px] text-[#786B6B]">{subline}</p>}

                  {!cancelled && (
                    <>
                      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#F3E8E8]">
                        <div
                          className="h-full rounded-full bg-[#8E1828] transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-[#786B6B]">
                        <span>
                          Step {currentStep + 1} of {total}
                        </span>
                        <span className="font-semibold text-[#8E1828]">{percent}% complete</span>
                      </div>
                      <div className="mt-3 hidden grid-cols-5 text-center text-[11px] text-[#786B6B] sm:grid">
                        {trackingSteps.map((s, i) => (
                          <span
                            key={s.label}
                            className={
                              i < currentStep
                                ? "font-semibold text-[#2E9B61]"
                                : i === currentStep
                                  ? "font-semibold text-[#8E1828]"
                                  : ""
                            }
                          >
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {hasCourier && (
                  <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-dashed border-[#CFC5C5] pt-4">
                    {order.CourierName && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#786B6B]">
                          Courier
                        </p>
                        <p className="text-sm font-semibold text-[#2D2525]">{order.CourierName}</p>
                      </div>
                    )}
                    {order.TrackingId && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#786B6B]">
                          Tracking ID
                        </p>
                        <p className="text-base font-bold text-[#8E1828]">{order.TrackingId}</p>
                      </div>
                    )}
                    {order.CourierBillPath && (
                      <a
                        href={fileUrl(order.CourierBillPath)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 self-end text-sm font-semibold text-[#8E1828] hover:underline"
                      >
                        View courier bill <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </section>

              {/* Timeline */}
              <section className={`${cardCls} p-5 md:p-6`}>
                <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#786B6B]">
                  Tracking Timeline
                </h2>
                <ol>
                  {trackingSteps.map((step, i) => {
                    const state: StepState = cancelled
                      ? i === 0
                        ? "done"
                        : "pending"
                      : i < currentStep
                        ? "done"
                        : i === currentStep
                          ? "current"
                          : "pending";
                    const StepIcon = stepIcons[i] ?? Package;
                    const isLast = i === trackingSteps.length - 1;
                    const open = expanded === i;
                    return (
                      <li key={step.label} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
                              state === "done"
                                ? "border-[#2E9B61] bg-[#2E9B61] text-white"
                                : state === "current"
                                  ? "border-[#8E1828] bg-[#8E1828] text-white ring-4 ring-[#8E1828]/15"
                                  : "border-[#E9DADA] bg-white text-[#786B6B]"
                            }`}
                          >
                            <StepIcon
                              className={`h-4 w-4 ${state === "current" ? "animate-pulse" : ""}`}
                            />
                          </span>
                          {!isLast && (
                            <span
                              className={`mt-1 w-0.5 flex-1 rounded-full ${
                                state === "done"
                                  ? "bg-[#2E9B61]"
                                  : state === "current"
                                    ? "bg-gradient-to-b from-[#8E1828] to-[#F3E8E8]"
                                    : "bg-[#F3E8E8]"
                              }`}
                            />
                          )}
                        </div>

                        <div className={isLast ? "" : "pb-4"}>
                          <button
                            type="button"
                            onClick={() => setExpanded(open ? null : i)}
                            aria-expanded={open}
                            className={`w-full rounded-xl border p-3.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8E1828] ${
                              state === "current"
                                ? "border-[#8E1828]/25 bg-[#FDF0F0]"
                                : "border-[#E9DADA] bg-white hover:bg-[#FFF7F7]"
                            }`}
                          >
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#786B6B]">
                                  Step {i + 1} of {total}
                                </p>
                                <p
                                  className={`truncate text-base font-semibold ${
                                    state === "pending" ? "text-[#786B6B]" : "text-[#2D2525]"
                                  }`}
                                >
                                  {step.label}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span
                                  className={`relative overflow-hidden rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_4px_rgba(0,0,0,0.25)] after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-1/2 after:bg-gradient-to-b after:from-white/35 after:to-transparent ${
                                    state === "done"
                                      ? "bg-gradient-to-b from-[#2E9B61] to-[#16643C]"
                                      : state === "current"
                                        ? "bg-gradient-to-b from-[#B0213A] to-[#5E0E19]"
                                        : "bg-gradient-to-b from-[#6B5F5F] to-[#3A3232]"
                                  }`}
                                >
                                  {state === "done"
                                    ? "Completed"
                                    : state === "current"
                                      ? "In progress"
                                      : "Pending"}
                                </span>
                                <ChevronDown
                                  className={`h-4 w-4 text-[#786B6B] transition-transform ${open ? "rotate-180" : ""}`}
                                />
                              </div>
                            </div>

                            {open && (
                              <div className="mt-3 space-y-2 border-t border-[#E9DADA] pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#8E1828]">
                                  <Clock className="h-3.5 w-3.5 shrink-0" /> {step.eta}
                                </p>
                                <p className="text-xs leading-relaxed text-[#786B6B]">
                                  {step.note}
                                </p>
                              </div>
                            )}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            </div>

            {/* Right column */}
            <aside className="mt-5 space-y-5 md:sticky md:top-6 md:mt-0">
              <section className={`${cardCls} p-5`}>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#786B6B]">
                  Order Details
                </h2>
                <dl className="mt-3 space-y-2.5 text-sm">
                  {[
                    ["Order ID", order.OrderNumber],
                    ["Order Date", orderDate],
                    [
                      "Payment Method",
                      order.PaymentMethod === "Razorpay"
                        ? "Razorpay (Online)"
                        : (order.PaymentMethod ?? "—"),
                    ],
                    ["Order Status", order.Status],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-[#786B6B]">{k}</dt>
                      <dd className="break-all text-right font-semibold text-[#2D2525]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {items.length > 0 && (
                <section className={`${cardCls} p-5`}>
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#786B6B]">
                    Item Summary
                  </h2>
                  <div className="mt-3 space-y-3">
                    {items.slice(0, 3).map((it, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {it.ProductImagePath ? (
                          <img
                            src={
                              it.ProductImagePath.startsWith("http")
                                ? it.ProductImagePath
                                : fileUrl(it.ProductImagePath)
                            }
                            alt={it.ProductName}
                            loading="lazy"
                            className="h-14 w-14 shrink-0 rounded-lg bg-[#FFF7F7] object-cover"
                          />
                        ) : (
                          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[#FFF7F7] text-[#8E1828]">
                            <Package className="h-5 w-5" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#2D2525]">
                            {it.ProductName}
                          </p>
                          <p className="text-xs text-[#786B6B]">Qty: {it.Qty}</p>
                        </div>
                        <span className="text-sm font-semibold text-[#2D2525]">
                          {inr(Number(it.Price) * Number(it.Qty))}
                        </span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-xs font-semibold text-[#8E1828]">
                        +{items.length - 3} more
                      </p>
                    )}
                  </div>
                </section>
              )}

              <section className={`${cardCls} p-5`}>
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FDF0F0] text-[#8E1828]">
                    <Headset className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#2D2525]">Need Help?</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#786B6B]">
                      If you have any questions about your order, feel free to contact us.
                    </p>
                    <Link
                      to="/about"
                      className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-[#8E1828] hover:underline"
                    >
                      Contact Support <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </Screen>
  );
}
