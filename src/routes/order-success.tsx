import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { inr } from "@/lib/mock-data";
import { apiGet } from "@/lib/api";
import { Screen } from "@/components/shop/AppChrome";
import { WhatsAppButton } from "@/components/shop/WhatsAppButton";

type OrderRow = {
  Orderkey: string;
  OrderNumber: string;
  Subtotal: string | number;
  Discount: string | number;
  ShippingFee: string | number;
  Total: string | number;
  PaymentMethod: string;
  ShippingName: string | null;
  ShippingAddress: string | null;
  CreatedOn: string;
};

type OrderItemRow = {
  ProductName: string;
  ProductImagePath: string | null;
  Qty: string | number;
  Price: string | number;
};

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const orderKey = searchParams.get("order") ?? undefined;
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);

  useEffect(() => {
    if (!orderKey) return;
    apiGet<OrderRow>(`/api/orders.php?key=${orderKey}`).then(setOrder).catch(() => setOrder(null));
    apiGet<OrderItemRow[]>(`/api/order_items.php?orderKey=${orderKey}`)
      .then(setItems)
      .catch(() => setItems([]));
  }, [orderKey]);

  return (
    <Screen title="Order Confirmed" back>
      <div className="gradient-blush px-6 py-10 text-center print:hidden">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h2 className="mt-4 font-display text-3xl font-semibold text-primary">Thank You!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your order has been placed successfully.
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div id="invoice" className="rounded-2xl border border-border bg-card p-4 text-sm">
          <div className="mb-3 flex items-center justify-between print:hidden">
            <h3 className="font-display text-lg font-semibold text-primary">Invoice</h3>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Save
            </button>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-semibold">{order?.OrderNumber ?? "—"}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground">Order Date</span>
            <span className="font-semibold">
              {order ? new Date(order.CreatedOn).toLocaleDateString("en-IN") : "—"}
            </span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-semibold">{order?.PaymentMethod ?? "—"}</span>
          </div>

          {items.length > 0 && (
            <ul className="mt-3 space-y-2 border-t border-border pt-3">
              {items.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate">
                    {item.ProductName} <span className="text-muted-foreground">× {item.Qty}</span>
                  </span>
                  <span className="font-semibold">{inr(Number(item.Price) * Number(item.Qty))}</span>
                </li>
              ))}
            </ul>
          )}

          {order && (
            <div className="mt-3 space-y-1 border-t border-border pt-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span>{inr(Number(order.Subtotal))}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Discount</span>
                <span>-{inr(Number(order.Discount))}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shipping</span>
                <span>{Number(order.ShippingFee) ? inr(Number(order.ShippingFee)) : "Free"}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-semibold">
                <span>Amount Paid</span>
                <span className="font-bold text-primary">{inr(Number(order.Total))}</span>
              </div>
            </div>
          )}

          {order?.ShippingAddress && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-xs font-semibold text-primary">Shipping To</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.ShippingName}
                <br />
                {order.ShippingAddress}
              </p>
            </div>
          )}
        </div>

        <div className="print:hidden">
          <Link
            to="/track"
            className="block rounded-full gradient-maroon py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
          >
            Track Your Order
          </Link>
          <Link
            to="/orders"
            className="mt-3 block rounded-full border border-primary py-3.5 text-center text-sm font-semibold text-primary"
          >
            View My Orders
          </Link>
          <div className="mt-3">
            <WhatsAppButton label="Need help? Chat on WhatsApp" />
          </div>
          <Link
            to="/categories"
            className="mt-2 block py-2 text-center text-xs font-semibold text-maroon-soft"
          >
            Continue Shopping →
          </Link>
        </div>
      </div>
    </Screen>
  );
}
