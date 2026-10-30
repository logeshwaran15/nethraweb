import { Link } from "react-router-dom";
import { useState } from "react";

/** Square category thumbnail with the name underneath. Falls back to the initial when the image is missing/broken so the grid always stays aligned. */
export function CategoryTile({
  slug,
  name,
  image,
}: {
  slug: string;
  name: string;
  image: string;
}) {
  const [broken, setBroken] = useState(false);
  const showImage = !!image && !broken;

  return (
    <Link
      to={`/category/${slug}`}
      className="group flex flex-col items-center gap-2 text-center"
    >
      <span className="relative block aspect-square w-full max-w-[120px] overflow-hidden rounded-2xl border-2 border-primary/15 bg-secondary shadow-[var(--shadow-card)] transition-all group-hover:border-primary/50 group-hover:shadow-[var(--shadow-soft)] md:max-w-[150px]">
        {showImage ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            width={300}
            height={300}
            onError={() => setBroken(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <span className="grid h-full w-full place-items-center font-display text-3xl font-semibold text-primary/60">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="line-clamp-2 w-full text-[11px] font-semibold leading-tight text-foreground md:text-sm">
        {name}
      </span>
    </Link>
  );
}

export const CATEGORY_GRID =
  "grid grid-cols-4 gap-x-2 gap-y-4 md:grid-cols-6 md:gap-x-6 md:gap-y-8";
