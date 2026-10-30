import { Star } from "lucide-react";

export function RatingDisplay({
  rating,
  reviews,
  size = "md",
}: {
  rating: number;
  reviews: number;
  size?: "sm" | "md";
}) {
  if (!reviews) {
    return <span className="text-caption text-muted-foreground">No reviews yet</span>;
  }
  const iconCls = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-1 text-caption text-muted-foreground">
      <Star className={`${iconCls} fill-gold text-gold`} />
      <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
      <span>({reviews} reviews)</span>
    </div>
  );
}
