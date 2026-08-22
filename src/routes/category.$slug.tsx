import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCatalog } from "@/lib/catalog-store";
import { Screen } from "@/components/shop/AppChrome";
import { ProductCard } from "@/components/shop/ProductCard";

export const Route = createFileRoute("/category/$slug")({
  head: () => ({
    meta: [
      { title: "Category — Nethra's Mehndi Stencils & Accessories" },
      {
        name: "description",
        content: "Explore this collection of premium mehndi stencils and hair accessories.",
      },
      { property: "og:title", content: "Category — Nethra's" },
      {
        property: "og:description",
        content: "Explore premium mehndi stencils and hair accessories by category.",
      },
    ],
  }),
  component: CategoryPage,
});

const sortOptions = ["Popularity", "Price: Low to High", "Newest", "Discount"] as const;
type SortOption = (typeof sortOptions)[number];

function CategoryPage() {
  const { slug } = Route.useParams();
  const { categories, products } = useCatalog();
  const category = categories.find((c) => c.slug === slug);
  const [sort, setSort] = useState<SortOption>("Popularity");

  const list = useMemo(() => {
    const matched = products.filter((p) => p.category === slug);
    const base = matched.length ? matched : products;
    const sorted = [...base];
    switch (sort) {
      case "Popularity":
        sorted.sort((a, b) => b.reviews - a.reviews);
        break;
      case "Price: Low to High":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "Newest":
        sorted.reverse();
        break;
      case "Discount":
        sorted.sort(
          (a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp,
        );
        break;
    }
    return sorted;
  }, [products, slug, sort]);

  return (
    <Screen title={category?.name ?? "Collection"} back>
      <div className="gradient-blush px-4 py-5">
        <h2 className="font-display text-2xl font-semibold text-primary">
          {category?.name ?? "Collection"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {list.length} product{list.length === 1 ? "" : "s"} available
        </p>
      </div>

      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-border px-4 py-3">
        {sortOptions.map((f) => (
          <button
            key={f}
            onClick={() => setSort(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
              sort === f
                ? "gradient-maroon text-primary-foreground"
                : "bg-secondary text-primary hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Screen>
  );
}
