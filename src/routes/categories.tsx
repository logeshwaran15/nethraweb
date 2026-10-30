import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { SearchX } from "lucide-react";
import { useCatalog } from "@/lib/catalog-store";
import { Screen } from "@/components/shop/AppChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { CategoryTile, CATEGORY_GRID } from "@/components/shop/CategoryTile";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { EmptyState, ErrorState } from "@/components/shop/EmptyState";
import { ProductGridSkeleton } from "@/components/shop/ProductGridSkeleton";
import { Reveal } from "@/components/shop/Reveal";

export default function CategoriesPage() {
  const { categories, products, loading, error, reload } = useCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q),
    );
  }, [products, query]);

  if (query) {
    return (
      <Screen title="Shop" showSearch>
        <div className="px-4 py-5">
          <SectionHeading
            title={`Search results for "${query}"`}
            subtitle={
              loading
                ? undefined
                : `${results.length} product${results.length === 1 ? "" : "s"} found`
            }
          />
          {loading ? (
            <ProductGridSkeleton />
          ) : error ? (
            <ErrorState description="Couldn't load products right now." onRetry={reload} />
          ) : results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matches found"
              description={`We couldn't find anything for "${query}". Try a different search term.`}
              actionLabel="Browse all products"
              actionTo="/categories"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {results.map((p, i) => (
                <Reveal key={p.id} index={i}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
          <button
            onClick={() => setSearchParams({})}
            className="mt-4 text-caption font-semibold text-primary underline"
          >
            Clear search
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Shop" showSearch>
      <div className="px-4 py-5">
        <SectionHeading
          title="Mehandi Stencils"
          subtitle="Premium stencils for every look"
        />
        <div className={CATEGORY_GRID}>
          {categories
            .filter((c) => c.group === "stencils")
            .map((c, i) => (
              <Reveal key={c.slug} index={i}>
                <CategoryTile slug={c.slug} name={c.name} image={c.image} />
              </Reveal>
            ))}
        </div>

        <div className="mt-8">
          <SectionHeading title="Accessories" subtitle="Hair clips, invisible chains & more" />
        </div>
        <div className={CATEGORY_GRID}>
          {categories
            .filter((c) => c.group === "accessories")
            .map((c, i) => (
              <Reveal key={c.slug} index={i}>
                <CategoryTile slug={c.slug} name={c.name} image={c.image} />
              </Reveal>
            ))}
        </div>

        <div className="mt-8">
          <SectionHeading title="All Products" />
        </div>
        {loading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <ErrorState description="Couldn't load products right now." onRetry={reload} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p, i) => (
              <Reveal key={p.id} index={i}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
