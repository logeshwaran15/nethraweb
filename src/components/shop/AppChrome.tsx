import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  Grid2x2,
  Heart,
  Home,
  Package,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import logo from "@/assets/a889bf53-43d8-42fc-b779-723c8ec5cf32.png";
import { apiGet } from "@/lib/api";
import { useShop } from "@/lib/shop-store";
import { Chatbot } from "./Chatbot";

type AnnouncementRow = {
  Message: string;
  SortOrder: string | number;
  IsActive: string | number;
};

function useAnnouncements() {
  const [messages, setMessages] = useState<string[]>([
    "FREE SHIPPING on orders above ₹999 · Premium Quality · Trendy Designs",
  ]);

  useEffect(() => {
    apiGet<AnnouncementRow[]>("/api/announcements.php")
      .then((rows) => {
        const active = rows
          .filter((r) => Number(r.IsActive) === 1)
          .sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder))
          .map((r) => r.Message);
        if (active.length) setMessages(active);
      })
      .catch(() => {
        // keep the fallback message if the API isn't reachable
      });
  }, []);

  return messages;
}

export function TopBar({
  title,
  showSearch = false,
  back = false,
}: {
  title?: string | undefined;
  showSearch?: boolean | undefined;
  back?: boolean | undefined;
}) {
  const navigate = useNavigate();
  const { count, wishlist } = useShop();
  const announcements = useAnnouncements();
  const marqueeText = announcements.join("   ·   ");

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
      <div className="gradient-maroon overflow-hidden py-1.5 text-[10px] font-medium tracking-wide text-primary-foreground">
        <div className="flex w-max animate-marquee">
          <span className="shrink-0 whitespace-nowrap px-3">{marqueeText}</span>
          <span aria-hidden="true" className="shrink-0 whitespace-nowrap px-3">
            {marqueeText}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {back ? (
            <button
              aria-label="Go back"
              onClick={() => navigate({ to: ".." })}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <Link to="/" className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-gold bg-secondary">
              <img src={logo} alt="Nethra's" className="h-full w-full object-cover" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-semibold leading-tight text-primary">
              {title ?? "Nethra's"}
            </h1>
            {!title && (
              <p className="truncate text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                Mehndi Stencils &amp; Accessories
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative grid h-9 w-9 place-items-center rounded-full text-primary"
          >
            <Heart className="h-5 w-5" />
            <Badge n={wishlist.length} />
          </Link>
          <Link
            id="cart-icon-target"
            to="/cart"
            aria-label="Cart"
            className="relative grid h-9 w-9 place-items-center rounded-full text-primary"
          >
            <ShoppingBag className="h-5 w-5" />
            <Badge n={count} />
          </Link>
        </div>
      </div>
      {showSearch && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search stencils, hair clips…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}
    </header>
  );
}

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary">
      {n}
    </span>
  );
}

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/categories", label: "Shop", icon: Grid2x2 },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/account", label: "Account", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useShop();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-border bg-card/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
                    active ? "bg-accent" : ""
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {to === "/cart" && <Badge n={count} />}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Screen({
  children,
  title,
  showSearch,
  back,
  hideNav,
  wide,
}: {
  children: ReactNode;
  title?: string | undefined;
  showSearch?: boolean | undefined;
  back?: boolean | undefined;
  hideNav?: boolean | undefined;
  wide?: boolean | undefined;
}) {
  return (
    <div className={`${wide ? "app-shell-wide" : "app-shell"} relative flex flex-col pb-24`}>
      <TopBar title={title} showSearch={showSearch} back={back} />
      <main className="flex-1">{children}</main>
      {!hideNav && <BottomNav />}
      <Chatbot />
    </div>
  );
}
