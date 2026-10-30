import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function SectionHeading({
  title,
  subtitle,
  to,
  toLabel = "View all",
}: {
  title: ReactNode;
  subtitle?: string | undefined;
  to?: string | undefined;
  toLabel?: string | undefined;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-h2 truncate text-primary">{title}</h2>
        {subtitle && <p className="text-caption mt-0.5 text-muted-foreground">{subtitle}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="text-caption shrink-0 font-semibold text-maroon-soft hover:underline"
        >
          {toLabel} &rarr;
        </Link>
      )}
    </div>
  );
}
