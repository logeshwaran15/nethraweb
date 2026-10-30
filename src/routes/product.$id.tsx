import { Link, useNavigate, useParams } from "react-router-dom";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  Minus,
  Package,
  Pencil,
  Plus,
  Recycle,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Video,
  Zap,
} from "lucide-react";
import { useCatalog } from "@/lib/catalog-store";
import { withVariant } from "@/lib/catalog";
import { inr } from "@/lib/mock-data";
import { Screen } from "@/components/shop/AppChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/shop/Reveal";
import { ImageGallery } from "@/components/shop/ImageGallery";
import { ProductDetailSkeleton } from "@/components/shop/ProductGridSkeleton";
import { PriceDisplay } from "@/components/shop/PriceDisplay";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/shop-store";
import { flyToCart } from "@/lib/fly-to-cart";
import { showToast } from "@/lib/toast";

const tabs = ["Description", "How to Use", "Shipping & Returns"] as const;

const LOW_STOCK_THRESHOLD = 5;

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, categories, loading } = useCatalog();
  const product = products.find((p) => p.id === id);
  const { addToCart, wishlist, toggleWishlist } = useShop();
  const [qty, setQty] = useState(1);
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Description");
  const imgRef = useRef<HTMLImageElement>(null);

  if (loading) {
    return (
      <Screen title="Loading…" back>
        <ProductDetailSkeleton />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen title="Not found" back>
        <div className="bg-[#FFF9F5] px-4 py-16">
          <div className="mx-auto max-w-md rounded-xl border border-[#E9DADA] bg-white p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FFF0F0] text-[#8E1828]">
              <Package className="h-7 w-7" />
            </span>
            <p className="mt-4 font-display text-xl font-semibold text-[#2D2525]">
              Product unavailable
            </p>
            <p className="mt-1 text-sm text-[#786B6B]">This product is no longer available.</p>
            <Link
              to="/categories"
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#8E1828] px-6 text-sm font-semibold text-white hover:bg-[#741421]"
            >
              Browse Shop
            </Link>
          </div>
        </div>
      </Screen>
    );
  }

  const liked = wishlist.includes(product.id);
  const related = products.filter((p) => p.id !== product.id && p.stock > 0).slice(0, 4);
  const categoryName =
    categories.find((c) => c.slug === product.category)?.name ??
    (product.group === "stencils" ? "Stencils" : "Accessories");
  // Products with options (e.g. colours 1-11): price + stock come from the picked option.
  const hasVariants = product.variants.length > 0;
  const activeVariant = hasVariants
    ? (product.variants.find((v) => v.label === pickedLabel) ??
      product.variants.find((v) => v.stock > 0) ??
      product.variants[0])
    : null;
  const cartProduct = activeVariant ? withVariant(product, activeVariant.label) : product;
  const shownPrice = cartProduct.price;
  const shownMrp = cartProduct.mrp;
  const activeStock = cartProduct.stock;
  const outOfStock = activeStock <= 0;
  const lowStock = !outOfStock && activeStock <= LOW_STOCK_THRESHOLD;
  const safeQty = Math.max(1, Math.min(qty, activeStock || 1));

  const handleAddToCart = () => {
    if (imgRef.current) flyToCart(imgRef.current);
    addToCart(cartProduct, safeQty);
    showToast(`Added ${safeQty} × ${cartProduct.name} to cart`, "success");
  };

  const handleBuyNow = () => {
    if (imgRef.current) flyToCart(imgRef.current);
    addToCart(cartProduct, safeQty);
    navigate("/cart");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard", "success");
    } catch {
      showToast("Couldn't copy link", "error");
    }
  };

  const benefitIcons = [Pencil, Recycle, ShieldCheck, Truck];
  const howToUse = [
    "Clean and dry the area before applying",
    "Place the stencil firmly on the skin",
    "Apply mehandi cone evenly over the cut-outs",
    "Peel off gently and let it dry",
  ];
  // The how-to-use steps are about mehandi stencils, so hide that tab for accessories (hair clips etc.).
  const visibleTabs = tabs.filter((t) => t !== "How to Use" || product.group === "stencils");
  const shippingRows = [
    { icon: Package, text: "Standard delivery in 3-4 days", highlight: false },
    { icon: Video, text: "An opening video is a must for returns within 7 days", highlight: true },
    { icon: ShieldCheck, text: "Secure online payment through Razorpay & WhatsApp", highlight: false },
  ];
  const fullStars = Math.round(product.rating);

  const qtyControl = (
    <div
      className="flex h-12 w-fit items-center overflow-hidden rounded-xl border border-[#E9DADA] bg-white"
      role="group"
      aria-label="Quantity"
    >
      <button
        aria-label="Decrease quantity"
        disabled={safeQty <= 1}
        onClick={() => setQty(Math.max(1, safeQty - 1))}
        className="grid h-full w-12 place-items-center text-[#8E1828] transition-colors hover:bg-[#FFF0F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8E1828] disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {safeQty}
      </span>
      <button
        aria-label="Increase quantity"
        disabled={safeQty >= activeStock}
        onClick={() => setQty(Math.min(activeStock, safeQty + 1))}
        className="grid h-full w-12 place-items-center text-[#8E1828] transition-colors hover:bg-[#FFF0F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8E1828] disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <Screen title={product.name} back>
      <div className="bg-[#FFF9F5] px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-6">
        <div className="mx-auto max-w-[1280px]">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-[#786B6B]"
          >
            <Link to="/" className="hover:text-[#8E1828]">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/categories" className="hidden hover:text-[#8E1828] sm:inline">
              Shop
            </Link>
            <ChevronRight className="hidden h-3 w-3 sm:block" />
            <Link to={`/category/${product.category}`} className="hover:text-[#8E1828]">
              {categoryName}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="max-w-[16rem] truncate font-semibold text-[#8E1828]">
              {product.name}
            </span>
          </nav>

          <div className="md:grid md:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] md:gap-10 lg:gap-14">
            <div>
              <ImageGallery
                images={product.images}
                alt={product.name}
                dim={outOfStock}
                imgRef={imgRef}
                variant="detail"
              >
                <button
                  aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                  aria-pressed={liked}
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white text-[#8E1828] shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-transform active:scale-90"
                >
                  <Heart
                    className={`h-5 w-5 transition-all ${liked ? "scale-110 fill-[#8E1828]" : ""}`}
                  />
                </button>
              </ImageGallery>
            </div>

            <div className="mt-5 space-y-5 md:mt-0">
              <div>
                <span className="inline-block rounded-full bg-[#FFF0F0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8E1828]">
                  {categoryName}
                </span>
                <h1 className="mt-3 line-clamp-2 font-display text-[28px] font-semibold leading-tight text-[#8E1828] md:text-[40px]">
                  {product.name}
                </h1>
                <div className="mt-2 flex items-center gap-2 text-sm text-[#786B6B]">
                  {product.reviews ? (
                    <>
                      <span className="flex gap-0.5" aria-hidden="true">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < fullStars ? "fill-[#C9A34A] text-[#C9A34A]" : "text-[#E9DADA]"}`}
                          />
                        ))}
                      </span>
                      <span className="font-semibold text-[#2D2525]">
                        {product.rating.toFixed(1)}
                      </span>
                      <span aria-label={`${product.reviews} reviews`}>
                        · {product.reviews} reviews
                      </span>
                    </>
                  ) : (
                    <span>No reviews yet</span>
                  )}
                </div>
              </div>

              <div className="border-t border-[#E9DADA] pt-4">
                <PriceDisplay price={shownPrice} mrp={shownMrp} size="lg" />
              </div>

              {product.tagline && (
                <p className="text-[15px] leading-relaxed text-[#786B6B]">{product.tagline}</p>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                {["Premium Quality", "Delivery time 3 - 4 days"].map(
                  (f, i) => {
                    const Icon = benefitIcons[i] ?? Check;
                    return (
                      <div
                        key={f}
                        className="flex items-center gap-2 rounded-xl bg-[#FFF0F0] px-3 py-2.5 text-[13px] font-medium text-[#8E1828]"
                      >
                        <Icon className="h-4 w-4 shrink-0" /> {f}
                      </div>
                    );
                  },
                )}
              </div>

              {hasVariants && (
                <div>
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#786B6B]">
                    Select option
                  </span>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Option">
                    {product.variants.map((v) => {
                      const selected = v.label === activeVariant?.label;
                      const soldOut = v.stock <= 0;
                      return (
                        <button
                          key={v.label}
                          role="radio"
                          aria-checked={selected}
                          onClick={() => {
                            setPickedLabel(v.label);
                            setQty(1);
                          }}
                          className={`relative min-h-11 min-w-14 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                            selected
                              ? "border-[#8E1828] bg-[#8E1828] text-white"
                              : "border-[#E9DADA] bg-white text-[#2D2525] hover:border-[#8E1828]"
                          } ${soldOut ? "opacity-50 line-through" : ""}`}
                        >
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!outOfStock ? (
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#786B6B]">
                      Quantity
                    </span>
                    {qtyControl}
                  </div>
                  {lowStock ? (
                    <div className="text-right">
                      <p className="flex items-center justify-end gap-1.5 text-sm font-semibold text-[#D9730D]">
                        <span className="h-2 w-2 rounded-full bg-[#D9730D]" /> Only {activeStock}{" "}
                        left!
                      </p>
                      <p className="text-xs text-[#786B6B]">Order soon</p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="flex items-center justify-end gap-1.5 text-sm font-semibold text-[#2E9B61]">
                        <span className="h-2 w-2 rounded-full bg-[#2E9B61]" /> In Stock
                      </p>
                      <p className="text-xs text-[#786B6B]">Ready to ship</p>
                    </div>
                  )}
                </div>
              ) : (
                <span className="inline-block rounded-md bg-[#F3E8E8] px-3 py-1.5 text-sm font-semibold text-[#786B6B]">
                  Out of Stock
                </span>
              )}

              <div className="space-y-2.5">
                <Button
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  variant="brandOutline"
                  className="h-[52px] w-full rounded-xl text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-[#8E1828] hover:text-white"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to Bag
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={outOfStock}
                  variant="brand"
                  className="h-[52px] w-full rounded-xl text-sm font-semibold uppercase tracking-wide"
                >
                  <Zap className="h-4 w-4" /> Buy It Now
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-[#786B6B] hover:text-[#8E1828]"
                >
                  <Heart className={`h-4 w-4 ${liked ? "fill-[#8E1828] text-[#8E1828]" : ""}`} />
                  {liked ? "In Wishlist" : "Add to Wishlist"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-[#786B6B] hover:text-[#8E1828]"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <section className="mt-8 rounded-xl border border-[#E9DADA] bg-white p-5 md:p-6">
            <div
              className="no-scrollbar flex gap-6 overflow-x-auto border-b border-[#E9DADA]"
              role="tablist"
            >
              {visibleTabs.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`min-h-11 shrink-0 border-b-2 px-1 pb-2 text-[13px] font-semibold transition-colors ${
                    tab === t
                      ? "border-[#8E1828] text-[#8E1828]"
                      : "border-transparent text-[#786B6B] hover:text-[#2D2525]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-4" role="tabpanel">
              {tab === "Description" && (
                <ul className="space-y-2.5">
                  {product.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-[#786B6B]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2E9B61]" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {tab === "How to Use" && (
                <ol className="space-y-3.5">
                  {howToUse.map((b, i) => (
                    <li key={b} className="flex items-center gap-4 text-sm text-[#2D2525]">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FFF0F0] text-xs font-bold text-[#8E1828]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {b}
                    </li>
                  ))}
                </ol>
              )}
              {tab === "Shipping & Returns" && (
                <ul className="space-y-3">
                  {shippingRows.map(({ icon: Icon, text, highlight }) => (
                    <li
                      key={text}
                      className={
                        highlight
                          ? "flex items-center gap-3 rounded-lg bg-[#8E1828] px-3 py-2 text-sm font-semibold text-white"
                          : "flex items-center gap-3 text-sm text-[#2D2525]"
                      }
                    >
                      <Icon
                        className={
                          highlight ? "h-4 w-4 shrink-0 text-white" : "h-4 w-4 shrink-0 text-[#8E1828]"
                        }
                      />
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {related.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-end justify-between">
                <h2 className="font-display text-[24px] font-semibold text-[#2D2525]">
                  You may also like
                </h2>
                <Link
                  to="/categories"
                  className="flex items-center gap-1 text-sm font-semibold text-[#8E1828] hover:underline"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {related.map((p, i) => (
                  <Reveal key={p.id} index={i}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Mobile sticky purchase bar */}
      {!outOfStock && (
        <div className="fixed inset-x-0 bottom-16 z-20 mx-auto w-full max-w-[480px] border-t border-[#E9DADA] bg-white/95 px-4 py-2.5 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <p className="text-xl font-bold leading-none text-[#8E1828]">{inr(shownPrice)}</p>
              <p className="mt-0.5 text-[11px] text-[#786B6B]">Qty {safeQty}</p>
            </div>
            <Button
              onClick={handleAddToCart}
              variant="brandOutline"
              className="h-11 flex-1 rounded-xl text-xs font-semibold uppercase"
            >
              Add to Bag
            </Button>
            <Button
              onClick={handleBuyNow}
              variant="brand"
              className="h-11 flex-1 rounded-xl text-xs font-semibold uppercase"
            >
              Buy Now
            </Button>
          </div>
        </div>
      )}
    </Screen>
  );
}
