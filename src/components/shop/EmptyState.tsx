import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="px-6 py-20 text-center">
      <Icon className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-h2 mt-4 text-primary">{title}</h2>
      <p className="text-body-lg mt-1 text-muted-foreground">{description}</p>
      {actionLabel && actionTo && (
        <Button asChild variant="brand" size="cta" className="mt-6">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <h2 className="text-h3 text-primary">{title}</h2>
      <p className="text-body-lg mt-1 text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="brandOutline" size="cta" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
