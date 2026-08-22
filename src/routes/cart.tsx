import { Link } from "react-router-dom";
import { useState } from "react";
import { Minus, Plus, Tag, Trash2 } from "lucide-react";
import { inr } from "@/lib/mock-data";
import { useCatalog } from "@/lib/catalog-store";
import { Screen } from "@/components/shop/AppChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { WhatsAppButton } from "@/components/shop/WhatsAppButton";
import { FallingFlowers } from "@/components/shop/FallingFlowers";
import { useShop } from "@/lib/shop-store";
import { showToast } from "@/lib/toast";

export default function CartPage() {
  const { cart, setQty, removeFromCart, subtotal, discount, shipping, total } = useShop();
  const { products } = useCatalog();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    const code = couponCode.trim().toUpperCase();
    setAppliedCoupon(code);
    showToast(`Coupon "${code}" applied`, "success");
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 3500);
  };

  return (
    <Screen title="Your Cart" back>
      {celebrate && <FallingFlowers />}
      {cart.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <p className="font-display text-2xl text-primary">Your cart is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Add something beautiful to it.</p>
          <Link
            to="/categories"
            className="mt-5 inline-block rounded-full gradient-maroon px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 p-4">
            {cart.map(({ product, qty }) => (
              <div
                key={product.id}
                className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold">{product.name}</p>
                    <button
                      aria-label={`Remove ${product.name}`}
                      onClick={() => removeFromCart(product.id)}
                      className="shrink-0 text-muted-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-primary">{inr(product.price)}</span>
                    <span className="text-[11px] text-muted-foreground line-through">
                      {inr(product.mrp)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 rounded-full border border-border px-2.5 py-1">
                      <button aria-label="Decrease quantity" onClick={() => setQty(product.id, qty - 1)}>
                        <Minus className="h-3.5 w-3.5 text-primary" />
                      </button>
                      <span className="w-5 text-center text-xs font-semibold">{qty}</span>
                      <button aria-label="Increase quantity" onClick={() => setQty(product.id, qty + 1)}>
                        <Plus className="h-3.5 w-3.5 text-primary" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold">{inr(product.price * qty)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-4 mb-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">Have a coupon code?</h3>
            </div>
            {appliedCoupon ? (
              <div className="mt-2 flex items-center justify-between rounded-xl bg-success/10 px-3 py-2">
                <span className="text-xs font-semibold text-success">
                  Coupon "{appliedCoupon}" applied
                </span>
                <button
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                  }}
                  className="text-xs font-semibold text-destructive"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
                <button
                  onClick={applyCoupon}
                  className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="mx-4 rounded-2xl border border-border bg-card p-4">
            <h3 className="font-display text-lg font-semibold text-primary">Order Summary</h3>
            <Row label={`Subtotal (${cart.length} items)`} value={inr(subtotal + discount)} />
            <Row label="Discount" value={`-${inr(discount)}`} accent />
            <Row label="Shipping" value={shipping ? inr(shipping) : "Free"} />
            <div className="mt-2 flex justify-between border-t border-border pt-2">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">{inr(total)}</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-success">
              You saved {inr(discount)} on this order
            </p>
            <Link
              to="/checkout"
              className="mt-4 block rounded-full gradient-maroon py-3 text-center text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
            >
              Proceed to Checkout
            </Link>
            <div className="mt-3">
              <WhatsAppButton />
            </div>
          </div>

          <div className="mt-7 px-4">
            <h3 className="mb-3 font-display text-xl font-semibold text-primary">You may also like</h3>
            <div className="grid grid-cols-2 gap-3">
              {products.slice(2, 6).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </>
      )}
    </Screen>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="mt-2 flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "font-medium text-success" : "font-medium"}>{value}</span>
    </div>
  );
}
