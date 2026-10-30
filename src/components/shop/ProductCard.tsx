import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useRef } from "react";
import type { Product } from "@/lib/catalog";
import { useShop } from "@/lib/shop-store";
import { flyToCart } from "@/lib/fly-to-cart";
import { PriceDisplay } from "./PriceDisplay";
import { Button } from "@/components/ui/button";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, wishlist, toggleWishlist } = useShop();
  const liked = wishlist.includes(product.id);
  const imgRef = useRef<HTMLImageElement>(null);
  const navigate = useNavigate();
  const hasVariants = product.variants.length > 0;
  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    // Products with options need the shopper to pick one first.
    if (hasVariants) {
      navigate(`/product/${product.id}`);
      return;
    }
    if (imgRef.current) flyToCart(imgRef.current);
    addToCart(product);
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-shadow md:hover:shadow-[var(--shadow-soft)]">
      <div className="relative overflow-hidden">
        <Link to={`/product/${product.id}`} aria-label={product.name}>
          <div className="relative aspect-square w-full">
            <img
              ref={imgRef}
              src={product.image || product.images[0]}
              alt={product.name}
              loading="lazy"
              width={800}
              height={800}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 md:group-hover:scale-105 ${
                outOfStock ? "grayscale" : ""
              }`}
            />
          </div>
        </Link>
        {outOfStock && (
          <span className="text-label absolute left-2 top-2 rounded-md bg-foreground/80 px-2 py-1 text-background">
            Out of stock
          </span>
        )}
        <button
          aria-label={
            liked ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`
          }
          aria-pressed={liked}
          onClick={() => toggleWishlist(product.id)}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-card/90 text-primary shadow-[var(--shadow-card)] md:right-3 md:top-3 md:h-9 md:w-9"
        >
          <Heart className={`h-4 w-4 md:h-[18px] md:w-[18px] ${liked ? "fill-primary" : ""}`} />
        </button>
      </div>
      <div className="space-y-1.5 p-2.5 md:space-y-2 md:p-4">
        <Link
          to={`/product/${product.id}`}
          className="line-clamp-1 block text-[13px] md:text-[15px]"
        >
          <span className="font-semibold text-foreground">{product.name}</span>
        </Link>
        {hasVariants && (
          <p className="text-[11px] text-muted-foreground">From</p>
        )}
        <PriceDisplay price={product.price} mrp={product.mrp} size="sm" />
        <Button
          onClick={handleAddToCart}
          disabled={outOfStock}
          variant="brandOutline"
          className="h-8 w-full text-[12px] md:h-9 md:text-sm"
        >
          {outOfStock ? "Out of Stock" : hasVariants ? "Select Option" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
