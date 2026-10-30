import { inr } from "@/lib/mock-data";

export function PriceDisplay({
  price,
  mrp,
  size = "md",
}: {
  price: number;
  mrp: number;
  size?: "sm" | "md" | "lg";
}) {
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const priceCls =
    size === "lg"
      ? "text-[30px] font-bold leading-none"
      : size === "sm"
        ? "text-lg font-bold"
        : "text-base";
  const mrpCls = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <span
        className={`text-price text-primary ${priceCls} ${
          size === "sm" ? "rounded-md bg-[#FDF0F0] px-2 py-0.5 leading-tight" : ""
        }`}
      >
        {inr(price)}
      </span>
      {off > 0 && (
        <>
          <span className={`${mrpCls} text-muted-foreground line-through`}>{inr(mrp)}</span>
          <span
            className={`${mrpCls} font-semibold text-success ${
              size === "lg" ? "rounded-md bg-success/10 px-2 py-0.5 uppercase" : ""
            }`}
          >
            {off}% off
          </span>
        </>
      )}
    </div>
  );
}
