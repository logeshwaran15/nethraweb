import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCatalog } from "@/lib/catalog-store";
import { Screen } from "@/components/shop/AppChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductGridSkeleton } from "@/components/shop/ProductGridSkeleton";
import { Reveal } from "@/components/shop/Reveal";
import { useShop } from "@/lib/shop-store";

export default function WishlistPage() {
  const { wishlist } = useShop();
  const { products, loading } = useCatalog();
  const saved = products.filter((p) => wishlist.includes(p.id));

  return (
    <Screen title="Wishlist">
      {loading ? (
        <div className="p-4">
          <ProductGridSkeleton count={wishlist.length || 4} />
        </div>
      ) : saved.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-3 font-display text-2xl font-semibold text-primary">
            Your wishlist is empty
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart on any product to save it here.
          </p>
          <Link
            to="/categories"
            className="mt-6 inline-block rounded-full gradient-maroon px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {saved.map((product, i) => (
            <Reveal key={product.id} index={i}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      )}
    </Screen>
  );
}
