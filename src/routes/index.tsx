import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { useCatalog } from "@/lib/catalog-store";
import { Screen } from "@/components/shop/AppChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { CategoryTile, CATEGORY_GRID } from "@/components/shop/CategoryTile";
import { HeroBanner } from "@/components/shop/HeroBanner";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { EmptyState, ErrorState } from "@/components/shop/EmptyState";
import { ProductGridSkeleton, CategoryChipsSkeleton } from "@/components/shop/ProductGridSkeleton";
import { Reveal } from "@/components/shop/Reveal";
import { WelcomeOfferPopup } from "@/components/shop/WelcomeOfferPopup";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { products, categories, loading, error, reload } = useCatalog();
  const bestSellers = products.filter((p) => p.group === "stencils");
  const accessories = products.filter((p) => p.group === "accessories");

  return (
    <Screen showSearch>
      <section className="gradient-blush px-2 pb-3 pt-2 md:relative md:left-1/2 md:w-screen md:-translate-x-1/2 md:px-6 md:pb-4 md:pt-3">
        <HeroBanner />
      </section>

      {error ? (
        <ErrorState description="Couldn't load the shop right now." onRetry={reload} />
      ) : (
        <>
          <section className="px-4 pt-6 md:px-8 md:pt-10">
            <SectionHeading title="Shop by Category" to="/categories" />
            {loading ? (
              <CategoryChipsSkeleton />
            ) : categories.length === 0 ? (
              <p className="text-body-lg text-muted-foreground">No categories yet.</p>
            ) : (
              <div className={CATEGORY_GRID}>
                {categories.map((c, i) => (
                  <Reveal key={c.slug} index={i}>
                    <CategoryTile slug={c.slug} name={c.name} image={c.image} />
                  </Reveal>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8 px-4 md:px-8">
            <SectionHeading title="Best Sellers" to="/categories" />
            {loading ? (
              <ProductGridSkeleton count={4} />
            ) : bestSellers.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title="No stencils yet"
                description="Check back soon for new designs."
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
                {bestSellers.slice(0, 4).map((p, i) => (
                  <Reveal key={p.id} index={i}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8 px-4 md:px-8">
            <SectionHeading title="Accessories" to="/categories" />
            {loading ? (
              <ProductGridSkeleton count={4} />
            ) : accessories.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title="No accessories yet"
                description="Check back soon for new arrivals."
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
                {accessories.map((p, i) => (
                  <Reveal key={p.id} index={i}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section className="mt-10 px-4 md:px-8">
        <div className="rounded-3xl gradient-maroon p-5 text-primary-foreground md:flex md:items-center md:justify-between md:p-10">
          <div>
            <h3 className="text-h2 text-primary-foreground">Join our mehandi family</h3>
            <p className="text-caption mt-1 text-primary-foreground/80">
              Get exclusive offers, new arrivals &amp; mehandi tips.
            </p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-3 flex gap-2 md:mt-0 md:w-[380px] md:shrink-0"
          >
            <input
              type="email"
              required
              aria-label="Email address"
              placeholder="Enter your email"
              className="min-w-0 flex-1 rounded-xl bg-card px-4 py-2.5 text-sm text-foreground outline-none"
            />
            <Button type="submit" variant="gold" size="sm" className="shrink-0">
              Subscribe
            </Button>
          </form>
        </div>
        <p className="text-caption py-6 text-center text-muted-foreground md:hidden">
          © 2026 Nethra's. All rights reserved.
        </p>
      </section>
      <WelcomeOfferPopup />
    </Screen>
  );
}
