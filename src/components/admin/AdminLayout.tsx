import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import sidebarBg from "@/assets/admin-sidebar-bg.png";
import logo from "@/assets/newlogo.jpeg";
import {
  LayoutDashboard,
  Package,
  Tags,
  BarChart3,
  Menu,
  X,
  Bell,
  Search,
  Store,
  Settings,
  ShoppingBag,
  Users,
  Ticket,
  LogOut,
  ChevronDown,
  Boxes,
  Image,
  Megaphone,
  Truck,
} from "lucide-react";
import { relativeTime, useAdminNotifications } from "@/lib/admin-notifications";
import { useAdmin } from "@/lib/admin-store";
import { apiGet } from "@/lib/api";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  {
    to: "/admin/products",
    label: "Products",
    icon: Package,
    exact: false,
  },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, exact: false },
  {
    to: "/admin/categories",
    label: "Categories",
    icon: Tags,
    exact: false,
  },
  {
    to: "/admin/customers",
    label: "Customers",
    icon: Users,
    exact: false,
  },
  {
    to: "/admin/coupons",
    label: "Coupons",
    icon: Ticket,
    exact: false,
  },
  { to: "/admin/banners", label: "Banners", icon: Image, exact: false },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone, exact: false },
  { to: "/admin/delivery", label: "Delivery Charges", icon: Truck, exact: false },
  { to: "/admin/reports", label: "Reports", icon: BarChart3, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
];

export function AdminLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { notifications, loading: notifLoading } = useAdminNotifications();
  const { products, categories, customers, coupons } = useAdmin();

  const [searchOrders, setSearchOrders] = useState<{ OrderNumber: string; ShippingName: string }[]>(
    [],
  );
  const ordersLoaded = useRef(false);
  const loadSearchOrders = () => {
    if (ordersLoaded.current) return;
    ordersLoaded.current = true;
    apiGet<{ OrderNumber: string; ShippingName: string }[]>("/api/orders.php")
      .then(setSearchOrders)
      .catch(() => {
        ordersLoaded.current = false;
      });
  };

  const trimmedQuery = query.trim().toLowerCase();
  const searchResults =
    trimmedQuery.length >= 2
      ? [
          ...products
            .filter((p) => p.name.toLowerCase().includes(trimmedQuery))
            .slice(0, 4)
            .map((p) => ({
              key: `p-${p.id}`,
              label: p.name,
              sub: "Product",
              to: `/admin/products?q=${encodeURIComponent(p.name)}`,
            })),
          ...categories
            .filter((c) => c.name.toLowerCase().includes(trimmedQuery))
            .slice(0, 3)
            .map((c) => ({
              key: `c-${c.slug}`,
              label: c.name,
              sub: "Category",
              to: `/admin/categories?q=${encodeURIComponent(c.name)}`,
            })),
          ...customers
            .filter(
              (u) =>
                u.name.toLowerCase().includes(trimmedQuery) ||
                u.email.toLowerCase().includes(trimmedQuery),
            )
            .slice(0, 3)
            .map((u) => ({
              key: `u-${u.id}`,
              label: u.name,
              sub: `Customer · ${u.email}`,
              to: `/admin/customers?q=${encodeURIComponent(u.email)}`,
            })),
          ...coupons
            .filter((c) => c.code.toLowerCase().includes(trimmedQuery))
            .slice(0, 3)
            .map((c) => ({
              key: `co-${c.code}`,
              label: c.code,
              sub: "Coupon",
              to: `/admin/coupons?q=${encodeURIComponent(c.code)}`,
            })),
        ]
      : [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const logout = () => {
    setProfileOpen(false);
    navigate("/");
  };

  const SideNav = (
    <nav className="relative space-y-1 p-3">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="admin-root min-h-screen bg-background">
      {/* Sidebar - desktop */}
      <aside
        style={{ backgroundImage: `url("${sidebarBg}")` }}
        className={`fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-cover bg-center before:absolute before:inset-0 before:bg-card/50 ${collapsed ? "" : "lg:flex"}`}
      >
        <div className="relative flex items-center gap-3 border-b border-border px-5 py-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#FFE4E8] shadow-[0_0_0_1.5px_rgba(201,163,74,0.55)]">
            <img src={logo} alt="Nethra's" className="h-full w-full object-cover" />
          </span>
          <div>
            <p className="font-sans text-lg leading-none text-primary">Nethra's</p>
            <p className="text-[11px] text-muted-foreground">Admin Panel</p>
          </div>
        </div>
        {SideNav}
        <div className="relative mt-auto p-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent"
          >
            <Store className="h-4 w-4" /> View Storefront
          </Link>
        </div>
      </aside>

      {/* Sidebar - mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside
            style={{ backgroundImage: `url("${sidebarBg}")` }}
            className="absolute inset-y-0 left-0 flex w-64 flex-col bg-cover bg-center before:absolute before:inset-0 before:bg-card/50"
          >
            <div className="relative flex items-center justify-between border-b border-border px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#FFE4E8] shadow-[0_0_0_1.5px_rgba(201,163,74,0.55)]">
                  <img src={logo} alt="Nethra's" className="h-full w-full object-cover" />
                </span>
                <p className="font-sans text-lg text-primary">Nethra's Admin</p>
              </div>
              <button aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            {SideNav}
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-0" : "lg:pl-64"}`}>
        {/* Top nav */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              aria-label="Toggle menu"
              onClick={() =>
                window.matchMedia("(min-width: 1024px)").matches
                  ? setCollapsed((c) => !c)
                  : setOpen(true)
              }
              className="grid h-9 w-9 place-items-center rounded-xl border border-border"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="relative min-w-0 max-w-sm flex-1" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => {
                  setSearchOpen(true);
                  loadSearchOrders();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults[0]) {
                    setSearchOpen(false);
                    setQuery("");
                    navigate(searchResults[0].to);
                  } else if (e.key === "Escape") {
                    setSearchOpen(false);
                  }
                }}
                placeholder="Search products, orders, customers, coupons…"
                className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />

              {searchOpen && trimmedQuery.length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-sm border border-border bg-card shadow-[var(--shadow-card)]">
                  {searchResults.length === 0 ? (
                    <p className="px-4 py-4 text-center text-xs text-muted-foreground">
                      No results for &quot;{query}&quot;.
                    </p>
                  ) : (
                    <ul>
                      {searchResults.map((r) => (
                        <li key={r.key}>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchOpen(false);
                              setQuery("");
                              navigate(r.to);
                            }}
                            className="flex w-full flex-col items-start gap-0.5 border-b border-border px-4 py-2.5 text-left last:border-b-0 hover:bg-accent/50"
                          >
                            <span className="text-sm font-semibold">{r.label}</span>
                            <span className="text-[11px] text-muted-foreground">{r.sub}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative" ref={notifRef}>
                <button
                  aria-label="Notifications"
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setProfileOpen(false);
                  }}
                  className="relative grid h-9 w-9 place-items-center rounded-xl border border-border"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-sm border border-border bg-card shadow-[var(--shadow-card)]">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-bold">Notifications</p>
                    </div>
                    {notifLoading ? (
                      <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                        Loading…
                      </p>
                    ) : notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                        Nothing to show right now.
                      </p>
                    ) : (
                      <ul className="max-h-80 overflow-y-auto">
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-accent/50"
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                              <n.icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold">{n.title}</p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">{n.detail}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {relativeTime(n.at)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2.5"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    NS
                  </span>
                  <span className="hidden text-xs font-semibold sm:block">Admin</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-48 rounded-sm border border-border bg-card p-1.5 shadow-[var(--shadow-card)]">
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="w-full">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-sans text-2xl text-primary sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              {actions}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
