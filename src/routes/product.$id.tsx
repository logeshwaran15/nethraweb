import { Link, useNavigate, useParams } from "react-router-dom";
import { useRef, useState } from "react";
import { Check, Heart, Minus, Plus, Star } from "lucide-react";
import { inr } from "@/lib/mock-data";
import { useCatalog } from "@/lib/catalog-store";
import { Screen } from "@/components/shop/AppChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { WhatsAppButton } from "@/components/shop/WhatsAppButton";
import { useShop } from "@/lib/shop-store";
import { flyToCart } from "@/lib/fly-to-cart";

const tabs = ["Description", "How to Use", "Shipping & Returns"] as const;

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useCatalog();
  const product = products.find((p) => p.id === id);
  const { addToCart, wishlist, toggleWishlist } = useShop();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Description");
  const imgRef = useRef<HTMLImageElement>(null);

  if (!product) {
    return (
      <Screen title="Not found" back>
        <div className="p-8 text-center text-sm text-muted-foreground">
          This product is no longer available.{" "}
          <Link to="/categories" className="font-semibold text-primary">
            Browse shop
          </Link>
        </div>
      </Screen>
    );
  }

  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const liked = wishlist.includes(product.id);
  const related = products.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <Screen title={product.name} back>
      <div className="relative">
        <img
          ref={imgRef}
          src={product.image}
          alt={product.name}
          width={800}
          height={800}
          className="aspect-square w-full object-cover"
        />
        <button
          aria-label="Add to wishlist"
          onClick={() => toggleWishlist(product.id)}
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-card/90 text-primary shadow-[var(--shadow-card)]"
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-primary" : ""}`} />
        </button>
      </div>

      <div className="space-y-4 px-4 py-5">
        <div>
          <h2 className="font-display text-2xl font-semibold text-primary">{product.name}</h2>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <span className="font-semibold text-foreground">{product.rating}</span>
            <span>({product.reviews} reviews)</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{inr(product.price)}</span>
            <span className="text-sm text-muted-foreground line-through">{inr(product.mrp)}</span>
            <span className="text-sm font-semibold text-success">{off}% OFF</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{product.tagline}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {["Easy to Apply", "Reusable Design", "Premium Quality", "Fast Delivery"].map((f) => (
            <div
              key={f}
              className="flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-[11px] font-medium text-primary"
            >
              <Check className="h-3.5 w-3.5" /> {f}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center gap-3 rounded-full border border-border px-3 py-1.5">
            <button aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus className="h-4 w-4 text-primary" />
            </button>
            <span className="w-6 text-center text-sm font-semibold">{qty}</span>
            <button aria-label="Increase" onClick={() => setQty((q) => q + 1)}>
              <Plus className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (imgRef.current) flyToCart(imgRef.current);
              addToCart(product, qty);
            }}
            className="rounded-full gradient-maroon py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
          >
            Add to Cart
          </button>
          <button
            onClick={() => {
              if (imgRef.current) flyToCart(imgRef.current);
              addToCart(product, qty);
              navigate("/cart");
            }}
            className="rounded-full bg-gold py-3 text-sm font-semibold text-primary"
          >
            Buy Now
          </button>
        </div>
        <WhatsAppButton />

        <div>
          <div className="no-scrollbar flex gap-4 overflow-x-auto border-b border-border">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 border-b-2 pb-2 text-[13px] font-semibold ${
                  tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <ul className="mt-3 space-y-2">
            {(tab === "Description"
              ? product.bullets
              : tab === "How to Use"
                ? [
                    "Clean and dry the area before applying",
                    "Place the stencil firmly on the skin",
                    "Apply mehndi cone evenly over the cut-outs",
                    "Peel off gently and let it dry",
                  ]
                : [
                    "Free shipping on orders above ₹999",
                    "Standard delivery in 3-5 days",
                    "Easy returns within 7 days",
                    "Cash on delivery available",
                  ]
            ).map((b) => (
              <li key={b} className="flex gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 mt-4 font-display text-xl font-semibold text-primary">
            You may also like
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
