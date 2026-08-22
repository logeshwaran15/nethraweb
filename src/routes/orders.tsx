import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { inr } from "@/lib/mock-data";
import { apiGet } from "@/lib/api";
import { Screen } from "@/components/shop/AppChrome";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — Nethra's" },
      { name: "description", content: "View your Nethra's mehndi stencil and accessory orders." },
      { property: "og:title", content: "My Orders — Nethra's" },
      { property: "og:description", content: "Track and review your past Nethra's orders." },
    ],
  }),
  component: OrdersPage,
});

const tabs = ["All", "Processing", "Shipped", "Delivered", "Cancelled"] as const;

const statusStyles: Record<string, string> = {
  Processing: "bg-gold/25 text-primary",
  Shipped: "bg-accent text-primary",
  Delivered: "bg-success/15 text-success",
  Cancelled: "bg-destructive/10 text-destructive",
};

type OrderRow = {
  Orderkey: string;
  OrderNumber: string;
  Total: string | number;
  Status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  CreatedOn: string;
};

type OrderItemRow = { ProductName: string; ProductImagePath: string | null };

type OrderWithItems = OrderRow & { items: OrderItemRow[] };

function OrdersPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<OrderRow[]>("/api/orders.php")
      .then(async (rows) => {
        const withItems = await Promise.all(
          rows.map(async (o) => ({
            ...o,
            items: await apiGet<OrderItemRow[]>(`/api/order_items.php?orderKey=${o.Orderkey}`).catch(
              () => [],
            ),
          })),
        );
        setOrders(withItems);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const list = tab === "All" ? orders : orders.filter((o) => o.Status === tab);

  return (
    <Screen title="My Orders">
      <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-border bg-card px-4 py-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === t
                ? "gradient-maroon text-primary-foreground"
                : "border border-border text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3 p-4">
        {!loading && list.length === 0 && (
          <div className="py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No {tab.toLowerCase()} orders yet.</p>
          </div>
        )}

        {list.map((order) => (
          <article
            key={order.Orderkey}
            className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-primary">{order.OrderNumber}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(order.CreatedOn).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[order.Status]}`}
              >
                {order.Status}
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              {order.items.map((item, i) => (
                <img
                  key={i}
                  src={item.ProductImagePath ?? ""}
                  alt={item.ProductName}
                  loading="lazy"
                  width={120}
                  height={120}
                  className="h-14 w-14 rounded-xl border border-border object-cover"
                />
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">
                {order.items.length} item{order.items.length === 1 ? "" : "s"}
              </span>
              <span className="text-sm font-bold text-primary">{inr(Number(order.Total))}</span>
            </div>

            <div className="mt-3 flex gap-2">
              <Link
                to="/track"
                search={{ order: order.Orderkey }}
                className="flex-1 rounded-full gradient-maroon py-2.5 text-center text-xs font-semibold text-primary-foreground"
              >
                Track Order
              </Link>
              <Link
                to="/categories"
                className="flex-1 rounded-full border border-primary py-2.5 text-center text-xs font-semibold text-primary"
              >
                Buy Again
              </Link>
            </div>
          </article>
        ))}
      </div>
    </Screen>
  );
}
