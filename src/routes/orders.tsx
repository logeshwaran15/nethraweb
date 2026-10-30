import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Gift,
  Headset,
  LogIn,
  Package,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { inr } from "@/lib/mock-data";
import { apiGet } from "@/lib/api";
import { Screen } from "@/components/shop/AppChrome";
import { useAuth } from "@/lib/auth-store";

const tabs = ["All", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
type Tab = (typeof tabs)[number];

const PAGE_SIZE = 10;

const sortOptions = [
  { id: "latest", label: "Latest First" },
  { id: "oldest", label: "Oldest First" },
  { id: "high", label: "Highest Amount" },
  { id: "low", label: "Lowest Amount" },
] as const;
type SortId = (typeof sortOptions)[number]["id"];

const statusStyles: Record<string, { cls: string; icon: typeof Clock }> = {
  Processing: { cls: "bg-[#F6EBCB] text-[#8A6A12]", icon: Clock },
  Shipped: { cls: "bg-[#E4EEFB] text-[#2F6FD0]", icon: Truck },
  Delivered: { cls: "bg-[#E3F4EA] text-[#2E9B61]", icon: Check },
  Cancelled: { cls: "bg-[#FDE7E5] text-[#D92D20]", icon: X },
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

const cardCls =
  "rounded-xl border border-[#E9DADA] bg-white shadow-[0_1px_8px_rgba(45,37,37,0.04)]";

export default function OrdersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("All");
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("latest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    apiGet<OrderRow[]>(`/api/orders.php?userKey=${user.Userkey}`)
      .then(async (rows) => {
        const withItems = await Promise.all(
          rows.map(async (o) => ({
            ...o,
            items: await apiGet<OrderItemRow[]>(
              `/api/order_items.php?orderKey=${o.Orderkey}`,
            ).catch(() => []),
          })),
        );
        setOrders(withItems);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      All: orders.length,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };
    for (const o of orders) c[o.Status] += 1;
    return c;
  }, [orders]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = orders.filter((o) => {
      if (tab !== "All" && o.Status !== tab) return false;
      if (!q) return true;
      return (
        o.OrderNumber.toLowerCase().includes(q) ||
        o.items.some((i) => i.ProductName.toLowerCase().includes(q))
      );
    });
    const time = (o: OrderRow) => new Date(o.CreatedOn.replace(" ", "T")).getTime();
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return time(a) - time(b);
        case "high":
          return Number(b.Total) - Number(a.Total);
        case "low":
          return Number(a.Total) - Number(b.Total);
        default:
          return time(b) - time(a);
      }
    });
  }, [orders, tab, query, sort]);

  useEffect(() => {
    setPage(1);
  }, [tab, query, sort]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const breadcrumb = (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-[#786B6B]">
      <Link to="/" className="hover:text-[#8E1828]">
        Home
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="font-semibold text-[#2D2525]">My Orders</span>
    </nav>
  );

  if (!user) {
    return (
      <Screen title="My Orders">
        <div className="bg-[#FFF9F5] px-4 py-16 md:px-8">
          <div className={`${cardCls} mx-auto max-w-md p-8 text-center`}>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FDF0F0] text-[#8E1828]">
              <Package className="h-7 w-7" />
            </span>
            <p className="mt-4 font-display text-xl font-semibold text-[#2D2525]">
              Sign in to see your orders
            </p>
            <p className="mt-1 text-sm text-[#786B6B]">
              Your order history is tied to your account.
            </p>
            <Link
              to="/account"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-[#8E1828] px-6 text-sm font-semibold text-white hover:bg-[#741421]"
            >
              <LogIn className="h-4 w-4" /> Login
            </Link>
          </div>
        </div>
      </Screen>
    );
  }

  const emptyAll = !loading && orders.length === 0;

  return (
    <Screen title="My Orders">
      <div className="bg-[#FFF9F5] px-4 pb-12 pt-5 md:px-8 md:pt-8">
        <div className="mx-auto max-w-[1280px]">
          {breadcrumb}

          {/* Header */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#FDF0F0] px-5 py-5 md:px-7">
            <div className="flex items-center gap-4">
              <span className="hidden h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-[#8E1828] sm:grid">
                <ShoppingBag className="h-7 w-7" />
              </span>
              <div>
                <h1 className="font-display text-[28px] font-semibold leading-tight text-[#8E1828] md:text-[34px]">
                  My Orders
                </h1>
                <p className="text-[13px] text-[#786B6B]">
                  Track your orders and view your complete purchase history.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 px-4 py-3">
              <Package className="h-7 w-7 text-[#8E1828]" />
              <div>
                <p className="font-display text-lg font-semibold leading-tight text-[#2D2525]">
                  {orders.length} Order{orders.length === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-[#786B6B]">Total orders placed</p>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className={`${cardCls} mb-5 flex flex-col gap-3 p-3 lg:flex-row lg:items-center`}>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  aria-pressed={tab === t}
                  className={`flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition-colors ${
                    tab === t
                      ? "border-[#8E1828] bg-[#8E1828] text-white"
                      : "border-[#E9DADA] bg-white text-[#2D2525] hover:border-[#8E1828]/40"
                  }`}
                >
                  {t}
                  <span
                    className={`grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold ${
                      tab === t ? "bg-white/25 text-white" : "bg-[#FDF0F0] text-[#8E1828]"
                    }`}
                  >
                    {counts[t]}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
              <div className="relative sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#786B6B]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search your orders"
                  placeholder="Search your orders..."
                  className="h-10 w-full rounded-full border border-[#E9DADA] bg-[#FFF7F7] pl-9 pr-3 text-sm outline-none focus:border-[#8E1828] focus:ring-4 focus:ring-[#FDF0F0]"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                aria-label="Sort orders"
                className="h-10 rounded-full border border-[#E9DADA] bg-white px-4 text-sm text-[#2D2525] outline-none focus:border-[#8E1828]"
              >
                {sortOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[minmax(0,70fr)_minmax(0,30fr)] lg:items-start lg:gap-6">
            {/* Order list */}
            <div>
              {loading && (
                <div className="space-y-3" aria-busy="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`${cardCls} flex gap-4 p-4`}>
                      <div className="flex gap-2">
                        <div className="h-16 w-16 animate-pulse rounded-xl bg-[#F5EDED]" />
                        <div className="hidden h-16 w-16 animate-pulse rounded-xl bg-[#F5EDED] sm:block" />
                      </div>
                      <div className="flex-1 space-y-2.5">
                        <div className="h-4 w-1/2 animate-pulse rounded bg-[#F5EDED]" />
                        <div className="h-3 w-1/4 animate-pulse rounded bg-[#F5EDED]" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-[#F5EDED]" />
                        <div className="flex gap-2 pt-1">
                          <div className="h-9 w-28 animate-pulse rounded-full bg-[#F5EDED]" />
                          <div className="h-9 w-24 animate-pulse rounded-full bg-[#F5EDED]" />
                        </div>
                      </div>
                      <div className="h-6 w-16 animate-pulse rounded bg-[#F5EDED]" />
                    </div>
                  ))}
                </div>
              )}

              {emptyAll && (
                <div className={`${cardCls} px-6 py-14 text-center`}>
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FDF0F0] text-[#8E1828]">
                    <ShoppingBag className="h-7 w-7" />
                  </span>
                  <p className="mt-4 font-display text-xl font-semibold text-[#2D2525]">
                    No Orders Yet
                  </p>
                  <p className="mt-1 text-sm text-[#786B6B]">
                    You haven&apos;t placed any orders yet.
                  </p>
                  <Link
                    to="/categories"
                    className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-[#8E1828] px-6 text-sm font-semibold text-white hover:bg-[#741421]"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}

              {!loading && orders.length > 0 && list.length === 0 && (
                <div className={`${cardCls} px-6 py-14 text-center`}>
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FDF0F0] text-[#8E1828]">
                    <Package className="h-7 w-7" />
                  </span>
                  <p className="mt-4 font-display text-xl font-semibold text-[#2D2525]">
                    {query.trim() ? "No Matching Orders" : `No ${tab} Orders`}
                  </p>
                  <p className="mt-1 text-sm text-[#786B6B]">
                    {query.trim()
                      ? "Try a different order number or product name."
                      : `You don't have any ${tab.toLowerCase()} orders yet.`}
                  </p>
                  <button
                    onClick={() => {
                      setTab("All");
                      setQuery("");
                    }}
                    className="mt-5 inline-flex h-11 items-center rounded-lg border border-[#8E1828] px-6 text-sm font-semibold text-[#8E1828] hover:bg-[#FDF0F0]"
                  >
                    View All Orders
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {paged.map((order) => {
                  const st = statusStyles[order.Status] ?? statusStyles["Processing"]!;
                  const StatusIcon = st.icon;
                  const shown = order.items.slice(0, order.items.length > 3 ? 2 : 3);
                  const extra = order.items.length - shown.length;
                  const names = order.items.slice(0, 2).map((i) => i.ProductName);
                  return (
                    <article key={order.Orderkey} className={`${cardCls} p-4 md:p-5`}>
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {shown.map((item, i) =>
                            item.ProductImagePath ? (
                              <img
                                key={i}
                                src={item.ProductImagePath}
                                alt={item.ProductName}
                                loading="lazy"
                                width={120}
                                height={120}
                                className="h-16 w-16 rounded-xl border border-[#E9DADA] bg-[#FFF7F7] object-cover md:h-[72px] md:w-[72px]"
                              />
                            ) : (
                              <span
                                key={i}
                                className="grid h-16 w-16 place-items-center rounded-xl bg-[#FFF7F7] text-[#8E1828] md:h-[72px] md:w-[72px]"
                              >
                                <Package className="h-5 w-5" />
                              </span>
                            ),
                          )}
                          {extra > 0 && (
                            <span className="grid h-16 w-16 place-items-center rounded-xl bg-[#FFF7F7] text-xs font-semibold text-[#786B6B] md:h-[72px] md:w-[72px]">
                              +{extra} more
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-base font-bold text-[#8E1828]">
                                Order #{order.OrderNumber}
                              </p>
                              <p className="text-xs text-[#786B6B]">
                                {new Date(order.CreatedOn.replace(" ", "T")).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short", year: "numeric" },
                                )}
                              </p>
                            </div>
                            <span
                              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${st.cls}`}
                            >
                              <StatusIcon className="h-3.5 w-3.5" /> {order.Status}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#2D2525]">
                                {order.items.length} item{order.items.length === 1 ? "" : "s"}
                              </p>
                              <p className="truncate text-[13px] text-[#786B6B]">
                                {names.join(", ")}
                                {order.items.length > 2 ? ` + ${order.items.length - 2} more` : ""}
                              </p>
                            </div>
                            <div className="flex flex-col items-start gap-2 sm:items-end">
                              <p className="text-xl font-bold leading-none text-[#8E1828]">
                                {inr(Number(order.Total))}
                              </p>
                              <div className="flex w-full gap-2 sm:w-auto">
                                <Link
                                  to={`/track?order=${order.Orderkey}`}
                                  className="flex h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#8E1828] px-3 sm:px-5 text-xs font-semibold text-white transition-colors hover:bg-[#741421] sm:flex-none"
                                >
                                  <Truck className="h-4 w-4" /> Track Order{" "}
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                                <Link
                                  to="/categories"
                                  className="flex h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#8E1828] bg-white px-3 sm:px-5 text-xs font-semibold text-[#8E1828] transition-colors hover:bg-[#FDF0F0] sm:flex-none"
                                >
                                  <ShoppingBag className="h-4 w-4" /> Buy Again
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {list.length > 0 && (
                <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-xs text-[#786B6B]">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, list.length)} of {list.length} order
                    {list.length === 1 ? "" : "s"}
                  </p>
                  {pageCount > 1 && (
                    <nav aria-label="Pagination" className="flex items-center gap-1.5">
                      <button
                        aria-label="Previous page"
                        onClick={() => setPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="grid h-10 w-10 place-items-center rounded-full border border-[#E9DADA] bg-white text-[#2D2525] hover:bg-[#FDF0F0] disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: pageCount }, (_, i) => i + 1)
                        .filter((n) => n === 1 || n === pageCount || Math.abs(n - currentPage) <= 1)
                        .map((n, idx, arr) => (
                          <span key={n} className="flex items-center gap-1.5">
                            {idx > 0 && n - arr[idx - 1]! > 1 && (
                              <span className="px-1 text-[#786B6B]">…</span>
                            )}
                            <button
                              onClick={() => setPage(n)}
                              aria-current={n === currentPage ? "page" : undefined}
                              className={`grid h-10 w-10 place-items-center rounded-full text-sm font-semibold ${
                                n === currentPage
                                  ? "bg-[#8E1828] text-white"
                                  : "border border-[#E9DADA] bg-white text-[#2D2525] hover:bg-[#FDF0F0]"
                              }`}
                            >
                              {n}
                            </button>
                          </span>
                        ))}
                      <button
                        aria-label="Next page"
                        onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                        disabled={currentPage === pageCount}
                        className="grid h-10 w-10 place-items-center rounded-full border border-[#E9DADA] bg-white text-[#2D2525] hover:bg-[#FDF0F0] disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </nav>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="mt-6 space-y-4 lg:mt-0">
              <section className={`${cardCls} p-5`}>
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[#2D2525]">
                  <Filter className="h-4 w-4 text-[#8E1828]" /> Quick Filters
                </h2>
                <ul className="mt-3 space-y-1">
                  {tabs.map((t) => (
                    <li key={t}>
                      <button
                        onClick={() => setTab(t)}
                        className={`flex h-10 w-full items-center justify-between rounded-lg px-3 text-sm transition-colors ${
                          tab === t
                            ? "bg-[#FDF0F0] font-semibold text-[#8E1828]"
                            : "text-[#2D2525] hover:bg-[#FFF7F7]"
                        }`}
                      >
                        <span>{t === "All" ? "All Orders" : t}</span>
                        <span className="flex items-center gap-2 text-xs">
                          <span className="font-semibold">{counts[t]}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-[#786B6B]" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={`${cardCls} bg-[#FFF7F7] p-5`}>
                <div className="flex items-start gap-3">
                  <Gift className="mt-0.5 h-7 w-7 shrink-0 text-[#8E1828]" />
                  <div>
                    <p className="font-display text-base font-semibold text-[#2D2525]">
                      Need more mehandi stencils?
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#786B6B]">
                      Explore our latest designs and complete your collection.
                    </p>
                  </div>
                </div>
                <Link
                  to="/categories"
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#8E1828] text-sm font-semibold text-white hover:bg-[#741421]"
                >
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Link>
              </section>

              <section className={`${cardCls} p-5`}>
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FDF0F0] text-[#8E1828]">
                    <Headset className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-[#2D2525]">
                      Need Help?
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#786B6B]">
                      If you have any questions about your orders, feel free to contact us.
                    </p>
                  </div>
                </div>
                <Link
                  to="/about"
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#8E1828] text-sm font-semibold text-[#8E1828] hover:bg-[#FDF0F0]"
                >
                  Contact Support <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </Screen>
  );
}
