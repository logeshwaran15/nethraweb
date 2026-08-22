import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Home,
  MapPin,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { trackingSteps } from "@/lib/mock-data";
import { apiGet } from "@/lib/api";
import { Screen } from "@/components/shop/AppChrome";
import { WhatsAppButton } from "@/components/shop/WhatsAppButton";

type StepState = "done" | "current" | "pending";

const stepIcons = [ClipboardList, CheckCircle2, Package, Truck, Home];

type OrderRow = {
  Orderkey: string;
  OrderNumber: string;
  Status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  CourierName: string | null;
  TrackingId: string | null;
  ShippingName: string | null;
  ShippingPhone: string | null;
  ShippingAddress: string | null;
};

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

  useEffect(() => {
    const load = async () => {
      if (orderKey) {
        const o = await apiGet<OrderRow>(`/api/orders.php?key=${orderKey}`).catch(() => null);
        setOrder(o);
      } else {
        const all = await apiGet<OrderRow[]>("/api/orders.php").catch(() => []);
        setOrder(all[0] ?? null);
      }
    };
    load();
  }, [orderKey]);

  if (!order) {
    return (
      <Screen title="Track Order" back>
        <div className="p-8 text-center text-sm text-muted-foreground">
          No orders to track yet.
        </div>
      </Screen>
    );
  }

  const cancelled = order.Status === "Cancelled";
  const currentStep = stepForStatus[order.Status];
  const total = trackingSteps.length;
  const active = trackingSteps[currentStep];
  const percent = Math.round(((currentStep + 1) / total) * 100);
  const delivered = order.Status === "Delivered";

  return (
    <Screen title="Track Order" back>
      <div className="w-full">
        {/* Status summary */}
        <div className="gradient-blush px-4 py-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Order ID</p>
              <p className="truncate font-display text-2xl font-semibold text-primary">
                {order.OrderNumber}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                cancelled
                  ? "bg-destructive text-destructive-foreground"
                  : delivered
                    ? "bg-success text-primary-foreground"
                    : "bg-primary text-primary-foreground"
              }`}
            >
              {order.Status}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur">
            {cancelled ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <XCircle className="h-4 w-4" /> This order was cancelled
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  {delivered ? <Package className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                  {delivered ? "Your order has been delivered" : "Your order is on the way"}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {delivered ? "Delivered" : active?.eta ?? "In progress"}
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Step {currentStep + 1} of {total}
                  </span>
                  <span>{percent}% complete</span>
                </div>
              </>
            )}

            {(order.CourierName || order.TrackingId) && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
                {order.CourierName && (
                  <span>
                    Courier: <span className="font-semibold text-primary">{order.CourierName}</span>
                  </span>
                )}
                {order.TrackingId && (
                  <span>
                    Tracking ID:{" "}
                    <span className="font-semibold text-primary">{order.TrackingId}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          {/* Timeline */}
          <ol className="space-y-1">
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
                  {/* marker + connector */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
                        state === "done"
                          ? "border-success bg-success text-primary-foreground"
                          : state === "current"
                            ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15"
                            : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {state === "done" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className={`h-4 w-4 ${state === "current" ? "animate-pulse" : ""}`} />
                      )}
                    </span>
                    {!isLast && (
                      <span
                        className={`mt-1 w-0.5 flex-1 rounded-full ${
                          state === "done"
                            ? "bg-success"
                            : state === "current"
                              ? "bg-gradient-to-b from-primary to-border"
                              : "bg-border"
                        }`}
                      />
                    )}
                  </div>

                  {/* content */}
                  <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : i)}
                      aria-expanded={open}
                      className={`w-full rounded-2xl border p-3 text-left transition-colors sm:p-4 ${
                        state === "current"
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Step {i + 1} of {total}
                          </p>
                          <p
                            className={`truncate text-sm font-semibold sm:text-base ${
                              state === "pending" ? "text-muted-foreground" : "text-primary"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`hidden rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline ${
                              state === "done"
                                ? "bg-success/12 text-success"
                                : state === "current"
                                  ? "bg-primary/12 text-primary"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {state === "done" ? "Completed" : state === "current" ? "In progress" : "Pending"}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                          />
                        </div>
                      </div>

                      {open && (
                        <div className="mt-3 space-y-2 border-t border-border/70 pt-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                            <Clock className="h-3.5 w-3.5 shrink-0" /> {step.eta}
                          </p>
                          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" /> {step.location}
                          </p>
                          <p className="text-[11px] leading-relaxed text-muted-foreground">{step.note}</p>
                        </div>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                <MapPin className="h-4 w-4 shrink-0" /> Delivery Address
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {order.ShippingName ?? "—"} · {order.ShippingPhone ?? "—"}
                <br />
                {order.ShippingAddress ?? "No address on file"}
              </p>
            </div>

            <WhatsAppButton label="Ask about this order" />
          </div>
        </div>
      </div>
    </Screen>
  );
}
