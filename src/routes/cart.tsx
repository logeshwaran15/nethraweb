import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Check, Gift, Lock, Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { inr } from "@/lib/mock-data";
import { useCatalog } from "@/lib/catalog-store";
import { lineKey } from "@/lib/catalog";
import { Screen } from "@/components/shop/AppChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { EmptyState } from "@/components/shop/EmptyState";
import { Reveal } from "@/components/shop/Reveal";
import { FallingFlowers } from "@/components/shop/FallingFlowers";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/shop-store";
import { showToast } from "@/lib/toast";

export default function CartPage() {
  const {
    cart,
    setQty,
    removeFromCart,
    clearCart,
    subtotal,
    discount,
    couponCode: appliedCoupon,
    couponDiscount,
    applyCoupon: applyCouponCode,
    removeCoupon,
  } = useShop();
  const { products } = useCatalog();
  const [couponInput, setCouponInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const applyCoupon = async () => {
    if (!couponInput.trim() || applying) return;
    setApplying(true);
    try {
      await applyCouponCode(couponInput);
      showToast(`Coupon "${couponInput.trim().toUpperCase()}" applied`, "success");
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not apply coupon", "error");
    } finally {
      setApplying(false);
    }
  };

  if (cart.length === 0) {
    return (
      <Screen title="Your Cart" back>
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add something beautiful to it."
          actionLabel="Continue Shopping"
          actionTo="/categories"
        />
      </Screen>
    );
  }

  return (
    <Screen title="Your Cart" back>
      {celebrate && <FallingFlowers />}
      <div className="bg-[#FFF9F5] px-4 pb-8 pt-5 md:px-8 md:pt-8">
        {/* Page heading */}
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[26px] font-semibold leading-tight text-[#8E1828] md:text-[32px]">
              Shopping Cart
            </h1>
            <p className="mt-1 text-[13px] text-[#786B6B]">
              Review your selected products before checkout.
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#FFF0F0] px-3.5 py-1.5 text-xs font-semibold text-[#8E1828]">
            <ShoppingBag className="h-4 w-4" /> {cart.length} Item{cart.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="md:grid md:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] md:items-start md:gap-6">
          {/* Cart items */}
          <section className="overflow-hidden rounded-xl border border-[#E9DADA] bg-white shadow-[0_1px_8px_rgba(45,37,37,0.04)]">
            <div className="flex items-center justify-between border-b border-[#E9DADA] px-4 py-4 md:px-6">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#2D2525]">Cart Items</h2>
                <p className="text-xs text-[#786B6B]">
                  {cart.length} item{cart.length === 1 ? "" : "s"} in your cart
                </p>
              </div>
              <button
                onClick={clearCart}
                className="flex min-h-10 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-[#786B6B] transition-colors hover:bg-[#FFF0F0] hover:text-[#8E1828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8E1828]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear All
              </button>
            </div>

            <ul className="divide-y divide-[#E9DADA]">
              {cart.map(({ product, qty }) => (
                <li key={lineKey(product)} className="flex gap-4 p-4 md:items-center md:gap-5 md:p-5">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#FFF7F7] md:h-[104px] md:w-[104px]">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      width={800}
                      height={800}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1 md:grid md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-6">
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2 md:block">
                        <p className="text-[15px] font-semibold leading-snug text-[#2D2525] md:text-base">
                          {product.name}
                        </p>
                        <button
                          aria-label={`Remove ${product.name}`}
                          title="Remove item"
                          onClick={() => removeFromCart(lineKey(product))}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-[#786B6B] transition-colors hover:bg-[#FFF0F0] hover:text-[#8E1828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8E1828] md:hidden"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-[#786B6B]">
                        {inr(product.price)} × {qty}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 md:mt-0 md:contents">
                      <div
                        className="flex h-10 items-center overflow-hidden rounded-full border border-[#E9DADA] bg-white"
                        role="group"
                        aria-label={`Quantity for ${product.name}`}
                      >
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => setQty(lineKey(product), qty - 1)}
                          className="grid h-full w-10 place-items-center text-[#8E1828] transition-colors hover:bg-[#FFF0F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8E1828]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span
                          className="w-8 text-center text-sm font-semibold tabular-nums"
                          aria-live="polite"
                        >
                          {qty}
                        </span>
                        <button
                          aria-label="Increase quantity"
                          disabled={qty >= product.stock}
                          onClick={() => setQty(lineKey(product), Math.min(product.stock, qty + 1))}
                          className="grid h-full w-10 place-items-center text-[#8E1828] transition-colors hover:bg-[#FFF0F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8E1828] disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="min-w-[4.5rem] text-right text-lg font-bold text-[#8E1828]">
                          {inr(product.price * qty)}
                        </p>
                        <button
                          aria-label={`Remove ${product.name}`}
                          title="Remove item"
                          onClick={() => removeFromCart(lineKey(product))}
                          className="hidden h-10 w-10 shrink-0 place-items-center rounded-md text-[#786B6B] transition-colors hover:bg-[#FFF0F0] hover:text-[#8E1828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8E1828] md:grid"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Order summary */}
          <aside className="mt-5 md:sticky md:top-6 md:mt-0">
            <div className="rounded-xl border border-[#E9DADA] bg-white p-5 shadow-[0_1px_8px_rgba(45,37,37,0.04)] md:p-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-[#2D2525]">
                <ShoppingBag className="h-5 w-5 text-[#8E1828]" /> Order Summary
              </h2>

              <div className="mt-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[#8E1828]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8E1828]">
                    Apply Coupon
                  </span>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-[#2E9B61]/10 px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#2E9B61]">
                      <Check className="h-4 w-4" /> Coupon &quot;{appliedCoupon}&quot; applied
                    </span>
                    <button
                      onClick={() => {
                        removeCoupon();
                        setCouponInput("");
                      }}
                      className="min-h-8 px-1 text-xs font-semibold text-[#8E1828] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      autoCapitalize="characters"
                      aria-label="Coupon code"
                      placeholder="Enter coupon code"
                      className="h-11 min-w-0 flex-1 rounded-lg border border-[#E9DADA] bg-white px-3 text-sm outline-none focus:border-[#8E1828] focus:ring-2 focus:ring-[#8E1828]/15"
                    />
                    <Button
                      onClick={applyCoupon}
                      disabled={applying}
                      variant="secondary"
                      size="sm"
                      className="h-11 shrink-0 px-5"
                    >
                      {applying ? "Checking…" : "Apply"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-2.5 text-sm">
                <Row
                  label={`Subtotal (${cart.length} item${cart.length === 1 ? "" : "s"})`}
                  value={inr(subtotal + discount)}
                />
                <Row label="Discount" value={`-${inr(discount)}`} accent />
                {couponDiscount > 0 && (
                  <Row
                    label={`Coupon (${appliedCoupon})`}
                    value={`-${inr(couponDiscount)}`}
                    accent
                  />
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dashed border-[#CFC5C5] pt-4">
                <span className="text-base font-semibold text-[#2D2525]">Total</span>
                <span className="text-[26px] font-bold leading-none text-[#8E1828]">
                  {inr(Math.max(0, subtotal - couponDiscount))}
                </span>
              </div>

              {discount + couponDiscount > 0 && (
                <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#2E9B61]/10 px-3 py-2 text-xs font-semibold text-[#2E9B61]">
                  <Tag className="h-3.5 w-3.5" /> You saved {inr(discount + couponDiscount)} on this
                  order
                </p>
              )}

              <Link
                to="/checkout"
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#8E1828] text-sm font-semibold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(142,24,40,0.25)] transition-colors hover:bg-[#741421] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E1828]"
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="mt-5 grid gap-3 border-t border-[#E9DADA] pt-4 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A34A]" />
                  <div>
                    <p className="text-xs font-semibold text-[#2D2525]">Secure SSL Checkout</p>
                    <p className="text-[11px] text-[#786B6B]">100% safe &amp; secure</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Gift className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A34A]" />
                  <div>
                    <p className="text-xs font-semibold text-[#2D2525]">Premium Luxury Packaging</p>
                    <p className="text-[11px] text-[#786B6B]">Carefully packed with love</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* You might also like */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[22px] font-semibold text-[#2D2525]">
                You might also like
              </h2>
              <p className="text-[13px] text-[#786B6B]">Explore more beautiful designs</p>
            </div>
            <Link
              to="/categories"
              className="flex items-center gap-1 text-sm font-semibold text-[#8E1828] hover:underline"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(2, 6).map((p, i) => (
              <Reveal key={p.id} index={i}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#786B6B]">{label}</span>
      <span className={accent ? "font-semibold text-[#2E9B61]" : "font-semibold text-[#2D2525]"}>
        {value}
      </span>
    </div>
  );
}
