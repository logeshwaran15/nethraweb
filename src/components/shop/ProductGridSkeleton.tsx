import { Skeleton } from "@/components/ui/skeleton";

// Mirrors ProductCard.tsx's exact structure/spacing so the skeleton doesn't
// jump when real content replaces it.
function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="relative">
        <Skeleton className="aspect-square w-full rounded-none" />
        <Skeleton className="absolute right-2 top-2 h-8 w-8 rounded-full md:right-3 md:top-3 md:h-9 md:w-9" />
      </div>
      <div className="space-y-1.5 p-2.5 md:space-y-2 md:p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full rounded-xl md:h-9" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Mirrors product.$id.tsx's layout: image left, info column right.
export function ProductDetailSkeleton() {
  return (
    <div
      className="bg-[#FFF9F5] px-4 py-5 md:grid md:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] md:gap-10 md:px-8 md:py-8 lg:gap-14"
      aria-busy="true"
      aria-label="Loading product"
    >
      <div>
        <Skeleton className="mb-4 hidden h-4 w-28 md:block" />
        <Skeleton className="aspect-square w-full rounded-2xl md:rounded-[20px]" />
      </div>
      <div className="space-y-5 px-4 py-5 md:px-0 md:py-0">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="border-t border-border pt-4">
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
        <div>
          <Skeleton className="mb-1.5 h-3 w-16" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
        <div className="space-y-2.5">
          <Skeleton className="h-[52px] w-full rounded-xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Mirrors the homepage/category card: aspect-[4/5] photo with a label area
// at the bottom, so the skeleton reads as "a card" rather than a plain box.
export function CategoryChipsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 md:gap-5"
      aria-busy="true"
      aria-label="Loading categories"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          <Skeleton className="absolute inset-0 rounded-none" />
          <div className="absolute inset-x-0 bottom-0 p-2.5 md:p-3.5">
            <Skeleton className="h-3 w-3/4 bg-card/40" />
          </div>
        </div>
      ))}
    </div>
  );
}
