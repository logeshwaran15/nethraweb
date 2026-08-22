import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCatalog } from "@/lib/catalog-store";
import { Screen } from "@/components/shop/AppChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { useShop } from "@/lib/shop-store";

export default function WishlistPage() {
  const { wishlist } = useShop();
  const { products } = useCatalog();
  const saved = products.filter((p) => wishlist.includes(p.id));

  return (
    <Screen title="Wishlist">
      {saved.length === 0 ? (
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
        <div className="grid grid-cols-2 gap-3 p-4">
          {saved.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Screen>
  );
}
