import { useEffect, useRef, useState } from "react";
import { AlertTriangle, PackageCheck, UserPlus, type LucideIcon } from "lucide-react";
import { apiGet } from "./api";
import { inr } from "./mock-data";
import { playNotifySound, playOrderSound } from "./notify-sound";

const LOW_STOCK_THRESHOLD = 5;
const MAX_NOTIFICATIONS = 8;
const POLL_MS = 10_000;

export type AdminNotification = {
  id: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  at: Date;
};

type OrderRow = {
  Orderkey: string;
  OrderNumber: string;
  Total: string | number;
  CreatedOn: string;
};

type ProductRow = {
  Productkey: string;
  Name: string;
  Stock: string | number;
  IsActive: string | number;
  ModifiedOn: string | null;
  CreatedOn: string;
};

type UserRow = {
  Userkey: string;
  FullName: string;
  CreatedOn: string;
};

export function relativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  // Tracks which notification ids have already been seen (across polls), so a
  // sound only plays for something genuinely new — never on the first load.
  const seenIds = useRef<Set<string> | null>(null);
  const seenOrderIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      Promise.all([
        apiGet<OrderRow[]>("/api/orders.php").catch(() => []),
        apiGet<ProductRow[]>("/api/products.php").catch(() => []),
        apiGet<UserRow[]>("/api/users.php?role=Customer").catch(() => []),
      ]).then(([orders, products, customers]) => {
        if (cancelled) return;

        const orderNotifs: AdminNotification[] = [...orders]
          .sort((a, b) => new Date(b.CreatedOn).getTime() - new Date(a.CreatedOn).getTime())
          .slice(0, 4)
          .map((o) => ({
            id: `order-${o.Orderkey}`,
            icon: PackageCheck,
            title: "New order received",
            detail: `Order #${o.OrderNumber} placed for ${inr(Number(o.Total))}`,
            at: new Date(o.CreatedOn),
          }));

        const lowStockNotifs: AdminNotification[] = products
          .filter(
            (p) =>
              Number(p.IsActive) === 1 &&
              Number(p.Stock) > 0 &&
              Number(p.Stock) <= LOW_STOCK_THRESHOLD,
          )
          .sort((a, b) => Number(a.Stock) - Number(b.Stock))
          .slice(0, 3)
          .map((p) => ({
            id: `stock-${p.Productkey}`,
            icon: AlertTriangle,
            title: "Low stock alert",
            detail: `${p.Name} has only ${p.Stock} unit${Number(p.Stock) === 1 ? "" : "s"} left`,
            at: new Date(p.ModifiedOn ?? p.CreatedOn),
          }));

        const customerNotifs: AdminNotification[] = [...customers]
          .sort((a, b) => new Date(b.CreatedOn).getTime() - new Date(a.CreatedOn).getTime())
          .slice(0, 3)
          .map((c) => ({
            id: `customer-${c.Userkey}`,
            icon: UserPlus,
            title: "New customer signed up",
            detail: `${c.FullName} created an account`,
            at: new Date(c.CreatedOn),
          }));

        const merged = [...orderNotifs, ...lowStockNotifs, ...customerNotifs]
          .sort((a, b) => b.at.getTime() - a.at.getTime())
          .slice(0, MAX_NOTIFICATIONS);

        // Orders are tracked across the full list (not just the displayed top-N)
        // so any genuinely new order triggers the louder order chime.
        const orderIds = new Set(orders.map((o) => o.Orderkey));
        const currentIds = new Set(merged.map((n) => n.id));
        if (seenIds.current && seenOrderIds.current) {
          const newOrder = [...orderIds].some((id) => !seenOrderIds.current!.has(id));
          const hasNew = [...currentIds].some((id) => !seenIds.current!.has(id));
          if (newOrder) playOrderSound();
          else if (hasNew) playNotifySound();
        }
        seenIds.current = currentIds;
        seenOrderIds.current = orderIds;

        setNotifications(merged);
        setLoading(false);
      });
    };

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { notifications, loading };
}
