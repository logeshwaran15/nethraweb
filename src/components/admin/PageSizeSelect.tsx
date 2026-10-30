export const ALL_ROWS = Number.MAX_SAFE_INTEGER;
const OPTIONS = [5, 10, 25, 75, 100, ALL_ROWS];

/** "Show N entries" dropdown for admin list pages. Default page size is 5. */
export function PageSizeSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      Show
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-sm border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/40"
      >
        {OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n === ALL_ROWS ? "All" : n}
          </option>
        ))}
      </select>
    </label>
  );
}
