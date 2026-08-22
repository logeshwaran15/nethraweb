import { createFileRoute, Link } from "@tanstack/react-router";
import { useCatalog } from "@/lib/catalog-store";
import { Screen } from "@/components/shop/AppChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { HeroBanner } from "@/components/shop/HeroBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nethra's — Mehndi Stencils & Hair Accessories" },
      {
        name: "description",
        content:
          "Shop premium reusable mehndi stencils, hair clips and invisible chains at Nethra's. Easy to apply, neat finish, fast delivery.",
      },
      { property: "og:title", content: "Nethra's — Mehndi Stencils & Hair Accessories" },
      {
        property: "og:description",
        content: "Premium mehndi stencils and elegant hair accessories, delivered to your door.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { products, categories } = useCatalog();
  const bestSellers = products.filter((p) => p.group === "stencils");
  const accessories = products.filter((p) => p.group === "accessories");

  return (
    <Screen showSearch>
      <section className="gradient-blush px-4 pb-6 pt-4">
        <HeroBanner />
      </section>

      <section className="px-4 pt-5">
        <SectionHead title="Shop by Category" to="/categories" />
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="w-[76px] shrink-0 text-center"
            >
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                width={800}
                height={800}
                className="h-[76px] w-[76px] rounded-full border-2 border-gold-soft object-cover"
              />
              <p className="mt-1.5 text-[11px] font-medium leading-tight">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 px-4">
        <Link to="/categories" className="rounded-2xl gradient-blush p-4">
          <p className="font-display text-lg font-semibold text-primary">Combo Offers</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Best deals on stencils</p>
          <span className="mt-2 inline-block text-[11px] font-semibold text-maroon-soft">
            Shop combos →
          </span>
        </Link>
        <Link to="/categories" className="rounded-2xl border border-gold-soft bg-card p-4">
          <p className="font-display text-lg font-semibold text-primary">New Arrivals</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Fresh designs weekly</p>
          <span className="mt-2 inline-block text-[11px] font-semibold text-maroon-soft">
            Explore now →
          </span>
        </Link>
      </section>

      <section className="mt-7 px-4">
        <SectionHead title="Best Sellers" to="/categories" />
        <div className="grid grid-cols-2 gap-3">
          {bestSellers.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mt-7 px-4">
        <SectionHead title="Accessories" to="/categories" />
        <div className="grid grid-cols-2 gap-3">
          {accessories.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mt-8 px-4">
        <div className="rounded-3xl gradient-maroon p-5 text-primary-foreground">
          <h3 className="font-display text-2xl font-semibold">Join our mehndi family</h3>
          <p className="mt-1 text-xs text-primary-foreground/80">
            Get exclusive offers, new arrivals &amp; mehndi tips.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              placeholder="Enter your email"
              className="min-w-0 flex-1 rounded-full bg-card px-4 py-2.5 text-sm text-foreground outline-none"
            />
            <button className="shrink-0 rounded-full bg-gold px-4 py-2.5 text-xs font-bold text-primary">
              Subscribe
            </button>
          </div>
        </div>
        <p className="py-6 text-center text-[11px] text-muted-foreground">
          © 2026 Nethra's. All rights reserved.
        </p>
      </section>
    </Screen>
  );
}

function SectionHead({ title, to }: { title: string; to: "/categories" }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h3 className="font-display text-[22px] font-semibold text-primary">{title}</h3>
      <Link to={to} className="text-[11px] font-semibold text-maroon-soft">
        View all →
      </Link>
    </div>
  );
}
