import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/a889bf53-43d8-42fc-b779-723c8ec5cf32.png";
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
  AlertTriangle,
  PackageCheck,
  UserPlus,
  Boxes,
  Image,
  Megaphone,
  Truck,
} from "lucide-react";

const notifications = [
  {
    icon: PackageCheck,
    title: "New order received",
    detail: "Order #NS123456789 placed for ₹190",
    time: "5 min ago",
  },
  {
    icon: AlertTriangle,
    title: "Low stock alert",
    detail: "Bridal Design Stencil has only 3 units left",
    time: "1 hour ago",
  },
  {
    icon: UserPlus,
    title: "New customer signed up",
    detail: "Divya Menon created an account",
    time: "3 hours ago",
  },
];

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { to: "/admin/products", label: "Products", icon: Package, exact: false },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, exact: false },
  { to: "/admin/categories", label: "Categories", icon: Tags, exact: false },
  { to: "/admin/customers", label: "Customers", icon: Users, exact: false },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket, exact: false },
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const logout = () => {
    setProfileOpen(false);
    navigate("/");
  };

  const SideNav = (
    <nav className="space-y-1 p-3">
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
    <div className="min-h-screen bg-background">
      {/* Sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary">
            <img src={logo} alt="Nethra's" className="h-full w-full object-cover" />
          </span>
          <div>
            <p className="font-display text-lg leading-none text-primary">Nethra's</p>
            <p className="text-[11px] text-muted-foreground">Admin Panel</p>
          </div>
        </div>
        {SideNav}
        <div className="mt-auto p-3">
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
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary">
                  <img src={logo} alt="Nethra's" className="h-full w-full object-cover" />
                </span>
                <p className="font-display text-lg text-primary">Nethra's Admin</p>
              </div>
              <button aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            {SideNav}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top nav */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="relative hidden flex-1 max-w-sm md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search admin…"
                className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
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
                  <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {notifications.length}
                  </span>
                </button>

                {notifOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-bold">Notifications</p>
                    </div>
                    <ul className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <li
                          key={n.title}
                          className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-accent/50"
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                            <n.icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold">{n.title}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{n.detail}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">{n.time}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
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
                  <div className="absolute right-0 z-40 mt-2 w-48 rounded-2xl border border-border bg-card p-1.5 shadow-[var(--shadow-card)]">
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
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl text-primary sm:text-3xl">{title}</h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                )}
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
