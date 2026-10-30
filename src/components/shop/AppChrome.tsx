import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  Facebook,
  Grid2x2,
  Heart,
  Home,
  Instagram,
  Package,
  Search,
  ShoppingBag,
  Sparkle,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import logo from "@/assets/newlogo.jpeg";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { inr } from "@/lib/mock-data";
import { useCatalog } from "@/lib/catalog-store";
import { useShop } from "@/lib/shop-store";
import { useAuth } from "@/lib/auth-store";
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
  const { products, categories } = useCatalog();
  const { user } = useAuth();
  const announcements = useAnnouncements();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLFormElement>(null);
  const desktopSearchRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (mobileSearchRef.current?.contains(target)) return;
      if (desktopSearchRef.current?.contains(target)) return;
      setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const trimmedQuery = query.trim();
  const suggestions =
    trimmedQuery.length >= 2
      ? products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
              p.tagline.toLowerCase().includes(trimmedQuery.toLowerCase()),
          )
          .slice(0, 6)
      : [];

  const goToProduct = (id: string) => {
    setSuggestOpen(false);
    navigate(`/product/${id}`);
  };

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    setSuggestOpen(false);
    const trimmed = query.trim();
    navigate(trimmed ? `/categories?q=${encodeURIComponent(trimmed)}` : "/categories");
  };

  const suggestionsDropdown = suggestOpen && trimmedQuery.length >= 2 && (
    <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[var(--shadow-dropdown)]">
      {suggestions.length === 0 ? (
        <p className="px-4 py-4 text-center text-xs text-muted-foreground">
          No products match &quot;{trimmedQuery}&quot;.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between bg-muted/60 px-4 py-2.5">
            <span className="text-label text-muted-foreground">Products</span>
            <span className="text-caption text-muted-foreground">{suggestions.length} found</span>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {suggestions.map((p) => {
              const categoryName = categories.find((c) => c.slug === p.category)?.name;
              const inStock = p.stock > 0;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToProduct(p.id)}
                    className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-accent/50"
                  >
                    <img
                      src={p.image}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      {categoryName && (
                        <span className="text-label block text-muted-foreground">
                          {categoryName}
                        </span>
                      )}
                      <span className="text-caption block font-semibold text-primary">
                        {inr(p.price)}
                      </span>
                    </span>
                    <span
                      className={`text-caption shrink-0 self-start font-semibold ${
                        inStock ? "text-success" : "text-destructive"
                      }`}
                    >
                      {inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="submit"
            onMouseDown={(e) => e.preventDefault()}
            className="text-caption flex w-full items-center justify-center gap-1.5 border-t border-border px-4 py-3 font-semibold text-primary hover:bg-accent/50"
          >
            <Search className="h-3.5 w-3.5" /> See all results for &quot;
            <span className="text-gold-soft">{trimmedQuery}</span>&quot; &rarr;
          </button>
        </>
      )}
    </div>
  );

  const marqueeItems = (keyPrefix: string) => (
    <div className="flex shrink-0 items-center">
      {announcements.map((msg, i) => (
        <span
          key={`${keyPrefix}-${i}`}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap px-4 md:px-6"
        >
          <Sparkle className="h-3 w-3 shrink-0 fill-current md:h-3.5 md:w-3.5" />
          {msg}
        </span>
      ))}
    </div>
  );

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
      <div className="gradient-maroon overflow-hidden py-1.5 text-[10px] font-medium tracking-wide text-primary-foreground md:py-2.5 md:text-sm">
        <div className="flex w-max animate-marquee">
          {marqueeItems("a")}
          <div aria-hidden="true" className="flex shrink-0 items-center">
            {marqueeItems("b")}
          </div>
        </div>
      </div>
      {/* Mobile / tablet compact header */}
      <div className="flex items-center gap-2.5 px-4 py-3 md:hidden">
        {back ? (
          <button
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <Link
            to="/"
            className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#FFE4E8] shadow-[0_0_0_1.5px_rgba(201,163,74,0.55)]"
          >
            <img src={logo} alt="Nethra's" className="h-full w-full object-cover" />
          </Link>
        )}

        {showSearch ? (
          <form
            ref={mobileSearchRef}
            onSubmit={submitSearch}
            role="search"
            className="relative min-w-0 flex-1"
          >
            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2.5 focus-within:ring-2 focus-within:ring-ring/40">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSuggestOpen(true)}
                type="search"
                aria-label="Search products"
                placeholder="Search stencils, hair clips…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="shrink-0 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {suggestionsDropdown}
          </form>
        ) : (
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-semibold leading-tight text-primary">
              {title ?? "Nethra's"}
            </h1>
            {!title && (
              <p className="truncate text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                Mehandi Stencils &amp; Accessories
              </p>
            )}
          </div>
        )}

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

      {/* Desktop header: logo, inline nav, search, icons */}
      <div className="mx-auto hidden max-w-[1500px] items-center gap-6 px-8 py-3.5 min-[1560px]:px-0 md:flex">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-[#FFE4E8] shadow-[0_0_0_1.5px_rgba(201,163,74,0.55)]">
            <img src={logo} alt="Nethra's" className="h-full w-full object-cover" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-semibold text-primary">
              Nethra&apos;s
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Mehandi &amp; Accessories
            </span>
          </span>
        </Link>

        <form
          ref={desktopSearchRef}
          onSubmit={submitSearch}
          role="search"
          className="relative ml-24 flex w-full max-w-[672px] min-w-0 shrink items-center gap-1 rounded-xl border border-border bg-secondary/60 p-1 pl-4 focus-within:border-primary"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSuggestOpen(true)}
            type="search"
            aria-label="Search products"
            placeholder="Search stencils, hair clips…"
            className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" variant="brand" size="sm" className="shrink-0">
            Search
          </Button>
          {suggestionsDropdown}
        </form>

        <nav className="ml-auto flex shrink-0 items-center gap-6 text-sm font-medium text-primary">
          {navItems
            .filter((n) => n.to !== "/cart" && !(n.to === "/account" && user))
            .map((n) => (
              <Link key={n.to} to={n.to} className="transition-colors hover:text-maroon-soft">
                {n.label}
              </Link>
            ))}
          <Link to="/contact" className="transition-colors hover:text-maroon-soft">
            Contact Us
          </Link>
          {user && <ProfileMenu />}
        </nav>

        <div className="flex shrink-0 items-center gap-3 -ml-2">
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-secondary"
          >
            <Heart className="h-5 w-5" />
            <Badge n={wishlist.length} />
          </Link>
          <Link
            id="cart-icon-target-desktop"
            to="/cart"
            aria-label="Cart"
            className="relative grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-secondary"
          >
            <ShoppingBag className="h-5 w-5" />
            <Badge n={count} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const itemCls =
    "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-accent/50";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-primary"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-bold uppercase text-gold">
          {user.FullName.charAt(0)}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-3 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-dropdown)]">
          <div className="bg-muted/60 px-4 py-3">
            <p className="text-sm font-bold text-primary">{user.FullName}</p>
            <p className="text-caption text-muted-foreground">{user.Email}</p>
          </div>
          <Link to="/orders" onClick={() => setOpen(false)} className={itemCls}>
            <Package className="h-4 w-4 text-primary" /> My Orders
          </Link>
          {user.Role === "Admin" && (
            <Link to="/admin" onClick={() => setOpen(false)} className={itemCls}>
              <LayoutDashboard className="h-4 w-4 text-primary" /> Admin Panel
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
              navigate("/");
            }}
            className={`${itemCls} text-destructive`}
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
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
  const { pathname } = useLocation();
  const { count } = useShop();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-border bg-card/95 backdrop-blur md:hidden">
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

type ContactRow = {
  SupportEmail: string | null;
  SupportPhone: string | null;
  WhatsappNumber: string | null;
  Address: string | null;
  InstagramUrl: string | null;
  FacebookUrl: string | null;
};

function useContactSettings() {
  const [contact, setContact] = useState<ContactRow | null>(null);
  useEffect(() => {
    apiGet<ContactRow>("/api/contact_settings.php")
      .then(setContact)
      .catch(() => setContact(null));
  }, []);
  return contact;
}

function Footer() {
  const contact = useContactSettings();

  return (
    <footer className="hidden bg-secondary/60 md:block">
      <div className="mx-auto grid max-w-[1440px] grid-cols-4 gap-8 px-8 py-12">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Nethra's"
              className="h-14 w-14 rounded-full bg-[#FFE4E8] object-cover shadow-[0_0_0_1.5px_rgba(201,163,74,0.55)]"
            />
            <p className="font-display text-xl font-semibold text-primary">Nethra&apos;s</p>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Premium mehandi stencils and accessories, crafted for every celebration.
          </p>
          {contact?.Address && (
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {contact.Address}
            </p>
          )}
          <div className="mt-4 flex gap-3 text-primary">
            {contact?.InstagramUrl && (
              <a
                href={contact.InstagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full bg-card"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {contact?.FacebookUrl && (
              <a
                href={contact.FacebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="grid h-9 w-9 place-items-center rounded-full bg-card"
              >
                <Facebook className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/categories" className="hover:text-primary">
                All Categories
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-primary">
                Wishlist
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-primary">
                Cart
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-primary">
                Track Order
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/account" className="hover:text-primary">
                My Account
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">Get in touch</p>
          {contact?.SupportEmail && (
            <a
              href={`mailto:${contact.SupportEmail}`}
              className="mt-3 block text-sm text-muted-foreground hover:text-primary"
            >
              {contact.SupportEmail}
            </a>
          )}
          {contact?.SupportPhone && (
            <a
              href={`tel:${contact.SupportPhone}`}
              className="mt-1 block text-sm text-muted-foreground hover:text-primary"
            >
              {contact.SupportPhone}
            </a>
          )}
          {contact?.WhatsappNumber && (
            <a
              href={`https://wa.me/${contact.WhatsappNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-sm text-muted-foreground hover:text-primary"
            >
              WhatsApp: {contact.WhatsappNumber}
            </a>
          )}
          <div className="mt-4 flex gap-2">
            <input
              placeholder="Enter your email"
              className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button className="shrink-0 rounded-full gradient-maroon px-4 py-2 text-xs font-bold text-primary-foreground">
              Join
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        <Link to="/terms" className="font-semibold hover:text-primary">
          Terms &amp; Conditions
        </Link>
        <span className="mx-2">|</span>
        © 2026 Nethra&apos;s. All rights reserved.
      </div>
    </footer>
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
    <div
      className={`${wide ? "app-shell-wide" : "app-shell"} relative flex flex-col pb-24 md:pb-0`}
    >
      <TopBar title={title} showSearch={showSearch} back={back} />
      <main className="animate-page-enter mx-auto w-full flex-1 md:max-w-[1440px]">{children}</main>
      <Footer />
      {!hideNav && <BottomNav />}
      <Chatbot />
    </div>
  );
}
