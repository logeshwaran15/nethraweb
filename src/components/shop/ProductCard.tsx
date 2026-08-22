import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useRef } from "react";
import { inr } from "@/lib/mock-data";
import type { Product } from "@/lib/catalog";
import { useShop } from "@/lib/shop-store";
import { flyToCart } from "@/lib/fly-to-cart";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, wishlist, toggleWishlist } = useShop();
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const liked = wishlist.includes(product.id);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleAddToCart = () => {
    if (imgRef.current) flyToCart(imgRef.current);
    addToCart(product);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="relative">
        <Link to="/product/$id" params={{ id: product.id }}>
          <img
            ref={imgRef}
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={800}
            height={800}
            className="aspect-square w-full object-cover"
          />
        </Link>
        <button
          aria-label="Add to wishlist"
          onClick={() => toggleWishlist(product.id)}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-card/90 text-primary shadow-[var(--shadow-card)]"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} />
        </button>
      </div>
      <div className="space-y-1.5 p-2.5">
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="line-clamp-1 block text-[13px]"
        >
          <span className="font-bold text-foreground">{product.name.split(" ")[0]}</span>{" "}
          <span className="text-muted-foreground">
            {product.name.split(" ").slice(1).join(" ")}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground line-through">
            {inr(product.mrp)}
          </span>
          <span className="rounded-md gradient-maroon px-2 py-0.5 text-xs font-bold text-primary-foreground">
            {inr(product.price)}
          </span>
          <span className="text-[10px] font-semibold text-success">{off}% off</span>
        </div>
        <button
          onClick={handleAddToCart}
          className="w-full rounded-full border border-primary py-1.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
