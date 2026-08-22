import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog-store";
import { Screen } from "@/components/shop/AppChrome";
import { ProductCard } from "@/components/shop/ProductCard";

export default function CategoriesPage() {
  const { categories, products } = useCatalog();
  return (
    <Screen title="Shop" showSearch>
      <div className="px-4 py-5">
        <h2 className="font-display text-2xl font-semibold text-primary">Mehndi Stencils</h2>
        <p className="text-xs text-muted-foreground">Premium reusable stencils for every look</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {categories
            .filter((c) => c.group === "stencils")
            .map((c) => (
              <CategoryTile key={c.slug} slug={c.slug} name={c.name} image={c.image} />
            ))}
        </div>

        <h2 className="mt-7 font-display text-2xl font-semibold text-primary">Accessories</h2>
        <p className="text-xs text-muted-foreground">Hair clips, invisible chains &amp; more</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {categories
            .filter((c) => c.group === "accessories")
            .map((c) => (
              <CategoryTile key={c.slug} slug={c.slug} name={c.name} image={c.image} />
            ))}
        </div>

        <h2 className="mt-8 font-display text-2xl font-semibold text-primary">All Products</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </Screen>
  );
}

function CategoryTile({ slug, name, image }: { slug: string; name: string; image: string }) {
  return (
    <Link
      to={`/category/${slug}`}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
    >
      <img
        src={image}
        alt={name}
        loading="lazy"
        width={800}
        height={800}
        className="aspect-[4/3] w-full object-cover"
      />
      <p className="px-3 py-2.5 text-[13px] font-semibold">{name}</p>
    </Link>
  );
}
